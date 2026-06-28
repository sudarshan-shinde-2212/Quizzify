
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { FfmpegService } from './ffmpeg.service';
import { WhisperService } from './whisper.service';
import { ParserService } from './parser.service';
import { AiContentGeneratorService } from './ai-content-generator.service';

const unlink = promisify(fs.unlink);

export type FileType = 'video' | 'audio' | 'document';

export interface GenerateQuizFromFileParams {
  filePath: string;
  fileType: FileType;
  difficulty: string;
  questionCount: number;
  questionType: string;
  language?: string;
}

@Injectable()
export class QuizFileProcessorService {
  constructor(
    private ffmpegService: FfmpegService,
    private whisperService: WhisperService,
    private parserService: ParserService,
    private aiContentGeneratorService: AiContentGeneratorService,
  ) {}

  async generateQuizFromFile(params: GenerateQuizFromFileParams) {
    const { filePath, fileType, difficulty, questionCount, questionType, language } = params;
    const tempDir = path.dirname(filePath);
    let extractedText = '';
    let tempFilesToCleanup: string[] = [];

    try {
      if (fileType === 'video' || fileType === 'audio') {
        console.log(`Processing ${fileType} file...`);
        const wavPath = await this.ffmpegService.extractAudioFromVideo(filePath, tempDir);
        tempFilesToCleanup.push(wavPath);
        extractedText = await this.whisperService.transcribeAudio(wavPath, tempDir);
      } else if (fileType === 'document') {
        console.log('Processing document file...');
        extractedText = await this.parserService.parseDocument(filePath, fileType);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new InternalServerErrorException('No content extracted from the file');
      }

      console.log('Content extracted, generating quiz...');
      const quiz = await this.aiContentGeneratorService.generateQuiz({
        text: extractedText,
        difficulty,
        questionCount,
        questionType,
        language: language || "English",
      });

      return quiz;
    } finally {
      // Cleanup all temp files
      try {
        await unlink(filePath);
        for (const f of tempFilesToCleanup) {
          if (fs.existsSync(f)) {
            await unlink(f);
          }
        }
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
    }
  }
}
