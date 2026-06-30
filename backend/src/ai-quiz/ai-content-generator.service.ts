import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { z } from 'zod';

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
  language: string;
  domains?: string[];
  topics?: Array<{
    name: string;
    allocatedQuestions: number;
    content: string;
  }>;
}

const TAXONOMY_PROFILES: Record<string, { remember: number; understand: number; apply: number; analyze: number }> = {
  'Easy': { remember: 70, understand: 30, apply: 0, analyze: 0 },
  'Medium': { remember: 30, understand: 40, apply: 20, analyze: 10 },
  'Hard': { remember: 10, understand: 20, apply: 40, analyze: 30 },
  'Mixed': { remember: 25, understand: 25, apply: 25, analyze: 25 }
};

@Injectable()
export class AiContentGeneratorService {
  private groq: Groq;
  private readonly logger = new Logger(AiContentGeneratorService.name);

  constructor(private configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

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

  private async processLargeText(text: string, language: string): Promise<string> {
    const maxChunkSize = 15000;
    if (text.length <= maxChunkSize) {
      return text;
    }

    this.logger.log(`Text length is ${text.length} characters. Processing in chunks...`);
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
        this.logger.error(`Failed to summarize chunk ${idx + 1}:`, err);
        summaries.push(chunk.substring(0, 2000));
      }
    }

    return `Here is a structured summary of the source material:\n\n${summaries.join('\n\n')}`;
  }

  async generateQuiz(params: QuizGenerationParams): Promise<GeneratedQuiz> {
    const { text, difficulty, questionCount, language, domains, topics } = params;
    const startTime = Date.now();

    // Determine Bloom's Taxonomy Profile
    const profile = TAXONOMY_PROFILES[difficulty] || TAXONOMY_PROFILES['Mixed'];
    const bloomInstructions = `The total of ${questionCount} questions must target the following cognitive levels according to Bloom's Taxonomy:
- Remember (Factual recall): generate roughly ${Math.round(questionCount * (profile.remember / 100))} questions.
- Understand (Conceptual explanation): generate roughly ${Math.round(questionCount * (profile.understand / 100))} questions.
- Apply (Calculation, predicting code execution, parsing reactions): generate roughly ${Math.round(questionCount * (profile.apply / 100))} questions.
- Analyze (Finding bugs, logical comparisons, chart relationships): generate roughly ${Math.round(questionCount * (profile.analyze / 100))} questions.`;

    // Determine Domain specific prompts
    let domainPrompt = '';
    if (domains && domains.length > 0) {
      const joinedDomains = domains.join(', ');
      domainPrompt = `\nDOMAIN CONTEXT: The materials cover the domains: [${joinedDomains}].`;
      
      const lowerDomains = domains.map(d => d.toLowerCase());
      if (lowerDomains.some(d => d.includes('programming') || d.includes('code') || d.includes('software'))) {
        domainPrompt += `\n- Programming Rules: For Apply/Analyze questions, provide real code snippets (in markdown blocks) in the question text or options. Emphasize syntax verification, debugging, and dry-run code execution outputs.`;
      }
      if (lowerDomains.some(d => d.includes('math') || d.includes('physics') || d.includes('chemistry') || d.includes('engineering') || d.includes('science'))) {
        domainPrompt += `\n- Equation Rules: Use LaTeX notation for mathematical equations, molecular balances, or physical quantities. Include calculations and formula application logic.`;
      }
      if (lowerDomains.some(d => d.includes('history') || d.includes('literature') || d.includes('geography') || d.includes('social'))) {
        domainPrompt += `\n- Factual Rules: Examine chronological sequences, cause-and-effect relationships, and historical facts.`;
      }
    }

    // Determine Topic Constraints
    let topicDirectives = '';
    let processedText = '';
    if (topics && topics.length > 0) {
      processedText = 'FUSION DOCUMENT DETAILED BELOW';
      topicDirectives = `You must generate questions from the following topics according to their allocated quantities:
` + topics.map(t => `- Topic "${t.name}": generate EXACTLY ${t.allocatedQuestions} questions from this content: \n"""\n${t.content}\n"""`).join('\n\n');
    } else {
      processedText = await this.processLargeText(text, language);
      topicDirectives = `Generate questions from this content:\n"""\n${processedText}\n"""`;
    }

    const prompt = `You are a professional educational assessor. Generate a multiple-choice quiz based on the provided content.

Language: ${language}
Difficulty: ${difficulty}
Question Type: MCQ (Multiple Choice with exactly 4 options per question)
Number of Questions: ${questionCount}
${domainPrompt}

COGNITIVE TARGETS (Bloom's Taxonomy Profile):
${bloomInstructions}

TOPICS & CONTENT DIRECTIVES:
${topicDirectives}

CORE ASSESSMENT GUIDELINES:
1. Formulate questions that test conceptual understanding, critical thinking, application of formulas, diagram relationships, or programming logic, rather than merely repeating or copying literal sentences.
2. Ensure all distractors (incorrect options) are plausible, distinct, and directly related to the concept.
3. Verify that each question has exactly ONE clearly correct option that matches the "correctAnswer" field verbatim.
4. For every question, provide a detailed "explanation" field (at least 15 characters) clarifying why the correctAnswer is correct and why the others are incorrect.

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
          temperature: 0.2,
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
            const matched = q.options.find(opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
            if (matched) {
              q.correctAnswer = matched;
            } else {
              throw new Error(`Question ${i + 1} correct answer "${q.correctAnswer}" does not match any of the options: [${q.options.join(', ')}]`);
            }
          }
        }

        this.logAiGeneration({
          type: 'file-MCQ',
          topicOrLength: `Domains: ${domains?.join(', ') || 'N/A'}, Topics: ${topics?.length || 0}`,
          latencyMs: Date.now() - startTime,
          retries: attempt - 1,
          success: true,
        });

        return validated;
      } catch (e: any) {
        lastError = e;
        this.logger.warn(`Quiz generation attempt ${attempt} failed:`, e.message || e);
      }
    }

    this.logAiGeneration({
      type: 'file-MCQ',
      topicOrLength: `Domains: ${domains?.join(', ') || 'N/A'}, Topics: ${topics?.length || 0}`,
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
