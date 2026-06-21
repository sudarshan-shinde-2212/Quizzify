import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class AiChatService {
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('groq.apiKey');
    this.groq = new Groq({ apiKey });
  }

  async sendMessage(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
    const chatCompletion = await this.groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
    });
    return chatCompletion.choices[0]?.message?.content || '';
  }

  async generateQuiz(topic: string, category: string, difficulty: string, questionCount: number) {
    const prompt = `You are an expert quiz generator. Generate a quiz about ${topic}.
Category: ${category}
Difficulty: ${difficulty}
Number of questions: ${questionCount}

You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting like \`\`\`json or \`\`\`. Do not include any introductory or concluding text.

The JSON object must have this exact structure:
{
  "title": "A short, engaging title for the quiz",
  "description": "A brief description of the quiz",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option"
    }
  ]
}

Requirements:
- Exactly ${questionCount} questions
- Exactly 4 options per question
- Exactly 1 correct answer which must exactly match one of the options
- No duplicate questions
- Valid JSON only`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const responseText = await this.sendMessage([
          { role: 'system', content: 'You are a JSON-only quiz generator API.' },
          { role: 'user', content: prompt }
        ]);

        let cleanedText = responseText.trim();
        const startIdx = cleanedText.indexOf('{');
        const endIdx = cleanedText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
          cleanedText = cleanedText.substring(startIdx, endIdx + 1);
        }

        const quizData = JSON.parse(cleanedText);

        if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length !== questionCount) {
          throw new Error('Invalid quiz structure or wrong number of questions');
        }

        return quizData;
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message || error);
        if (attempt === 3) {
          throw new Error('Failed to generate a valid quiz after 3 attempts');
        }
      }
    }
  }
}
