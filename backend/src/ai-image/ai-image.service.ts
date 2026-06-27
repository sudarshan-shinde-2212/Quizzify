import { Injectable, InternalServerErrorException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiImageService implements OnModuleInit {
  private readonly logger = new Logger(AiImageService.name);
  private pollinationsApiKey: string | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pollinationsApiKey = this.configService.get<string>('POLLINATIONS_API_KEY') ?? null;
    if (this.pollinationsApiKey) {
      this.logger.log('Pollinations AI initialized successfully');
    } else {
      this.logger.warn('POLLINATIONS_API_KEY not set, using free tier');
    }
  }

  async generateImage(prompt: string): Promise<{ imageUrl: string }> {
    try {
      if (!prompt.trim()) {
        throw new BadRequestException('Prompt cannot be empty');
      }

      this.logger.log('Pollinations image generation started');

      const encodedPrompt = encodeURIComponent(prompt);
      let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
      
      if (this.pollinationsApiKey) {
        imageUrl += `&key=${this.pollinationsApiKey}`;
      }

      this.logger.log('Pollinations image generated successfully');
      return { imageUrl };
    } catch (error) {
      this.logger.error('Pollinations image generation failed', error);
      throw new InternalServerErrorException('Failed to generate AI image. Please try again later.');
    }
  }
}