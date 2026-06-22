import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { QuizzesService } from '../quizzes/quizzes.service';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class AiQuizService {
  private groq: Groq;

  constructor(
    private configService: ConfigService,
    private quizzesService: QuizzesService,
    private questionsService: QuestionsService,
  ) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  async generateQuiz(topic: string, category: string, difficulty: string, questionCount: number) {
    const prompt = `Generate a multiple choice quiz about "${topic}".
Category: ${category}
Difficulty: ${difficulty}
Number of questions: ${questionCount}

Return ONLY valid JSON matching this schema exactly, with no markdown formatting or extra text:
{
  "title": "A short engaging title for the quiz",
  "description": "A brief description",
  "questions": [
    {
      "question": "The question text?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": "The exact string of the correct option",
      "marks": 1
    }
  ]
}`;

    let jsonResponse: any;
    for (let attempts = 0; attempts < 3; attempts++) {
      try {
        const response = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || '{}';
        jsonResponse = JSON.parse(content);

        // Validate basic structure and EXACT question count
        if (
          jsonResponse.title && 
          Array.isArray(jsonResponse.questions) && 
          jsonResponse.questions.length === Number(questionCount)
        ) {
          return jsonResponse;
        } else if (jsonResponse.questions) {
          console.warn(`Attempt ${attempts}: AI returned ${jsonResponse.questions.length} questions, expected ${questionCount}. Retrying...`);
        }
      } catch (e) {
        console.error('Groq parsing error on attempt ' + attempts, e);
      }
    }
    throw new InternalServerErrorException(`Failed to generate exactly ${questionCount} questions from AI after multiple attempts.`);
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
      const questionText = q.question || q.text || q.questionText;
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
