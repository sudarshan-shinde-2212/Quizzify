import { Injectable, InternalServerErrorException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiImageService implements OnModuleInit {
  private readonly logger = new Logger(AiImageService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        this.logger.log('Gemini initialized successfully for prompt refinement');
      } catch (error) {
        this.logger.error('Gemini initialization failed', error);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not set, using raw prompts');
    }
  }

  private async refinePrompt(prompt: string): Promise<string> {
    if (!this.genAI) {
      return prompt;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert prompt engineer for AI image generation. Improve the following educational diagram/illustration prompt for an online quiz question. Make it detailed, specific, professional, and suitable for a clear educational image. Respond ONLY with the refined prompt, no extra text. Original prompt: "${prompt}"`,
              },
            ],
          },
        ],
      });

      const response = await result.response;
      const refinedPrompt = response.text();
      this.logger.log('Prompt refined successfully');
      return refinedPrompt || prompt;
    } catch (error) {
      this.logger.error('Failed to refine prompt with Gemini', error);
      return prompt;
    }
  }

  async generateImage(prompt: string): Promise<{ imageUrl: string }> {
    try {
      if (!prompt.trim()) {
        throw new BadRequestException('Prompt cannot be empty');
      }

      this.logger.log('Starting image generation with prompt:', prompt);

      const refinedPrompt = await this.refinePrompt(prompt);
      this.logger.log('Using refined prompt:', refinedPrompt);

      const encodedPrompt = encodeURIComponent(refinedPrompt);
      const pollinationsKey = this.configService.get<string>('POLLINATIONS_API_KEY');

      let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
      if (pollinationsKey) {
        imageUrl += `&key=${pollinationsKey}`;
      }

      this.logger.log('Generated image URL');
      return { imageUrl };
    } catch (error) {
      this.logger.error('Image generation error:', error);
      throw new InternalServerErrorException('Failed to generate AI image. Please try again later.');
    }
  }
}
