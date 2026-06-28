import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { QuizzesService } from '../quizzes/quizzes.service';
import { QuestionsService } from '../questions/questions.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiQuizService {
  private groq: Groq;
  private readonly logger = new Logger(AiQuizService.name);

  constructor(
    private configService: ConfigService,
    private quizzesService: QuizzesService,
    private questionsService: QuestionsService,
  ) {
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

  async generateQuiz(topic: string, category: string, difficulty: string, questionCount: number) {
    const startTime = Date.now();
    const prompt = `Generate a multiple choice quiz about "${topic}".
Category: ${category}
Difficulty: ${difficulty}
Number of questions: ${questionCount}

Return ONLY valid JSON matching this schema exactly, with no markdown formatting or extra text. Make sure to generate EXACTLY ${questionCount} questions. Ensure all options are distinct and there are no duplicate questions.
{
  "title": "A short engaging title for the quiz",
  "description": "A brief description of what this quiz covers",
  "questions": [
    {
      "question": "The question text?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": "The exact string of the correct option (must match one of the options exactly)",
      "explanation": "A brief explanation why this answer is correct"
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
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || '{}';
        const jsonResponse = JSON.parse(content);

        // Validate basic structure and EXACT question count
        if (!jsonResponse.title || !jsonResponse.description || !Array.isArray(jsonResponse.questions)) {
          throw new Error('AI response is missing title, description, or questions array.');
        }

        if (jsonResponse.questions.length !== Number(questionCount)) {
          throw new Error(`AI generated ${jsonResponse.questions.length} questions, expected exactly ${questionCount}.`);
        }

        // Validate that correct answer matches one of the options exactly
        for (let i = 0; i < jsonResponse.questions.length; i++) {
          const q = jsonResponse.questions[i];
          if (!q.options || q.options.length < 2) {
            throw new Error(`Question ${i + 1} does not have at least 2 options.`);
          }
          if (!q.options.includes(q.correctAnswer)) {
            const matched = q.options.find((opt: string) => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
            if (matched) {
              q.correctAnswer = matched;
            } else {
              throw new Error(`Question ${i + 1} correct answer "${q.correctAnswer}" does not match any of the options.`);
            }
          }
        }

        // Log successful generation
        this.logAiGeneration({
          type: 'topic',
          topicOrLength: topic,
          latencyMs: Date.now() - startTime,
          retries: attempt - 1,
          success: true,
        });

        return jsonResponse;
      } catch (e: any) {
        lastError = e;
        console.warn(`Topic quiz generation attempt ${attempt} failed:`, e.message || e);
      }
    }

    // Log failed generation
    this.logAiGeneration({
      type: 'topic',
      topicOrLength: topic,
      latencyMs: Date.now() - startTime,
      retries: 2,
      success: false,
      error: lastError?.message || String(lastError),
    });

    throw new InternalServerErrorException(
      `Failed to generate exactly ${questionCount} questions from AI after 3 attempts. Error: ${lastError?.message || lastError}`
    );
  }

  async saveAiQuiz(adminId: string, quizData: any) {
    const quiz = await this.quizzesService.create({
      title: quizData.title,
      description: quizData.description,
      instructions: quizData.instructions || 'Answer all questions.',
      startDate: quizData.startDate || new Date().toISOString(),
      endDate: quizData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      durationInMinutes: quizData.durationInMinutes || 30,
      totalMarks: quizData.questions.reduce((acc: number, q: any) => acc + (Number(q.marks) || 1), 0),
      questionCount: quizData.questions.length,
      isPublished: true,
      visibility: quizData.visibility,
    }, adminId);

    for (const q of quizData.questions) {
      // Map AI response (question, options, correctAnswer) to CreateQuestionDto (text, optionA-D, correctOption)
      const questionText = q.question || q.text || q.questionText; // Keep backward compatibility
      const options = q.options || [q.optionA, q.optionB, q.optionC, q.optionD];
      const correctAnswer = q.correctAnswer || q.correctOption;
      
      // Find correctOption index to determine A/B/C/D
      let correctOptionIndex = -1;
      if (typeof correctAnswer === 'string') {
        correctOptionIndex = options.findIndex((opt: string) => opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase());
      } else if (typeof correctAnswer === 'number') {
        correctOptionIndex = correctAnswer;
      } else {
        // If AI returns A/B/C/D directly
        const optionMap = { A: 0, B: 1, C: 2, D: 3 };
        correctOptionIndex = optionMap[correctAnswer as keyof typeof optionMap] ?? -1;
      }

      // Default to first option if correct answer not found
      if (correctOptionIndex < 0 || correctOptionIndex >= 4) {
        correctOptionIndex = 0;
      }

      const correctOption = ['A', 'B', 'C', 'D'][correctOptionIndex] as any;

      await this.questionsService.create(quiz.id, {
        text: questionText,
        imageUrl: q.imageUrl || undefined,
        optionA: options[0] || '',
        optionB: options[1] || '',
        optionC: options[2] || '',
        optionD: options[3] || '',
        correctOption,
        marks: Number(q.marks) || 1,
      });
    }

    return quiz;
  }
}
