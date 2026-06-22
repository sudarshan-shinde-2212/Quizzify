
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class AiImageService {
  private groq: Groq;

  constructor(private configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  private async refinePrompt(prompt: string): Promise<string> {
    const response = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Create a detailed, professional image generation prompt for an educational quiz question illustration. The original prompt is: "${prompt}". 

Respond with ONLY the refined image prompt, no extra text. Make it clear, specific, suitable for an online quiz, simple, and professional.`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content || prompt;
  }

  async generateImage(prompt: string): Promise<{ imageUrl: string }> {
    try {
      const refinedPrompt = await this.refinePrompt(prompt);
      const encodedPrompt = encodeURIComponent(refinedPrompt);
      const pollinationsKey = this.configService.get<string>('POLLINATIONS_API_KEY');
      
      let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
      if (pollinationsKey) {
        imageUrl += `&key=${pollinationsKey}`;
      }
      
      return { imageUrl };
    } catch (error) {
      console.error('Image generation error', error);
      throw new InternalServerErrorException('Failed to generate image');
    }
  }
}
