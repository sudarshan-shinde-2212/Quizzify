import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import Groq from 'groq-sdk';

@Injectable()
export class WhisperService {
  private groq: Groq;

  constructor(private configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  async transcribeAudio(audioPath: string, outputDir: string): Promise<string> {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new InternalServerErrorException(`Audio file not found at: ${audioPath}`);
      }

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-large-v3-turbo',
        response_format: 'json',
      });

      return transcription.text;
    } catch (error: any) {
      console.error('Groq Whisper transcription error:', error);
      throw new InternalServerErrorException(`Failed to transcribe audio via Groq: ${error.message}`);
    }
  }
}
