import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const GeneratedQuestionSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(10).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).optional(),
  marks: z.number().int().positive().default(1),
});

const GeneratedQuizSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  questions: z.array(GeneratedQuestionSchema).min(1),
});

export type GeneratedQuiz = z.infer<typeof GeneratedQuizSchema>;

export interface QuizGenerationParams {
  text: string;
  difficulty: string;
  questionCount: number;
  questionType: string;
  language: string;
}

@Injectable()
export class AiContentGeneratorService {
  private groq: Groq;
  private readonly logger = new Logger(AiContentGeneratorService.name);

  constructor(private configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  // Log AI generation details to NestJS Logger (stdout) for production log aggregators
  private logAiGeneration(details: {
    type: string;
    topicOrLength: string;
    latencyMs: number;
    tokensUsed?: number;
    retries: number;
    success: boolean;
    error?: string;
  }) {
    this.logger.log(
      `[AI_GENERATION_METRICS] ${JSON.stringify({
        timestamp: new Date().toISOString(),
        ...details,
      })}`
    );
  }

  // Chunk, summarize, and merge large text to fit token limits and preserve structure
  private async processLargeText(text: string, language: string): Promise<string> {
    const maxChunkSize = 15000; // ~3000 words
    if (text.length <= maxChunkSize) {
      return text;
    }

    console.log(`Text length is ${text.length} characters. Processing in chunks...`);
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.substring(i, i + maxChunkSize));
    }

    const summaries: string[] = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const chunkPrompt = `You are an educational assistant. Extract all key concepts, facts, definitions, and important details from this text section. Keep the output as a concise, structured list of bullet points in ${language}. Do not lose any factual accuracy or important context.
      
Section ${idx + 1} of ${chunks.length}:
${chunk}`;

      try {
        const response = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: chunkPrompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
        });

        const summary = response.choices[0]?.message?.content || '';
        summaries.push(summary);
      } catch (err) {
        console.error(`Failed to summarize chunk ${idx + 1}:`, err);
        // Fallback: just use a portion of the raw chunk text
        summaries.push(chunk.substring(0, 2000));
      }
    }

    return `Here is a structured summary of the source material:\n\n${summaries.join('\n\n')}`;
  }

  async generateQuiz(params: QuizGenerationParams): Promise<GeneratedQuiz> {
    const { text, difficulty, questionCount, questionType, language } = params;
    const startTime = Date.now();

    // 1. Process large text using chunking and summarization
    const processedText = await this.processLargeText(text, language);

    const prompt = `Generate a quiz based on the following content.

Language: ${language}
Difficulty: ${difficulty}
Question Type: ${questionType} (Make sure all questions are of this type. If "True/False", each question must have exactly 2 options: "True" and "False".)
Number of Questions: ${questionCount}

Content:
${processedText}

Return ONLY valid JSON matching this schema exactly, with NO markdown formatting or extra text. Make sure to generate EXACTLY ${questionCount} questions. Ensure all options are distinct and there are no duplicate questions.
{
  "title": "A short engaging quiz title (in ${language})",
  "description": "A brief description of what this quiz covers (in ${language})",
  "questions": [
    {
      "question": "The question text (in ${language})",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option (must match one of the options exactly)",
      "explanation": "A brief explanation why this answer is correct (in ${language})",
      "marks": 1
    }
  ]
}`;

    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '{}';
        const jsonResponse = JSON.parse(content);

        // Validate basic Zod schema
        const validated = GeneratedQuizSchema.parse(jsonResponse);

        // Validate exact question count
        if (validated.questions.length !== Number(questionCount)) {
          throw new Error(`AI generated ${validated.questions.length} questions, expected exactly ${questionCount}`);
        }

        // Validate that correct answer matches one of the options exactly
        for (let i = 0; i < validated.questions.length; i++) {
          const q = validated.questions[i];
          if (!q.options.includes(q.correctAnswer)) {
            // Attempt to fix minor spacing/case mismatch
            const matched = q.options.find(opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
            if (matched) {
              q.correctAnswer = matched;
            } else {
              throw new Error(`Question ${i + 1} correct answer "${q.correctAnswer}" does not match any of the options: [${q.options.join(', ')}]`);
            }
          }
        }

        // Log successful generation
        this.logAiGeneration({
          type: `file-${questionType}`,
          topicOrLength: `Text length: ${text.length}`,
          latencyMs: Date.now() - startTime,
          retries: attempt - 1,
          success: true,
        });

        return validated;
      } catch (e: any) {
        lastError = e;
        console.warn(`Quiz generation attempt ${attempt} failed:`, e.message || e);
      }
    }

    // Log failed generation
    this.logAiGeneration({
      type: `file-${questionType}`,
      topicOrLength: `Text length: ${text.length}`,
      latencyMs: Date.now() - startTime,
      retries: 2,
      success: false,
      error: lastError?.message || String(lastError),
    });

    throw new InternalServerErrorException(
      `Failed to generate a valid quiz with exactly ${questionCount} questions after 3 attempts. Error: ${lastError?.message || lastError}`
    );
  }
}
