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
      model: 'llama3-8b-8192',
    });
    return chatCompletion.choices[0]?.message?.content || '';
  }
}
