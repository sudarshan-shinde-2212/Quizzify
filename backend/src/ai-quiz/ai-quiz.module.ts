import { Module } from '@nestjs/common';
import { AiQuizService } from './ai-quiz.service';
import { AiQuizController } from './ai-quiz.controller';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { QuestionsModule } from '../questions/questions.module';
import { FfmpegService } from './ffmpeg.service';
import { WhisperService } from './whisper.service';
import { ParserService } from './parser.service';
import { AiContentGeneratorService } from './ai-content-generator.service';
import { QuizFileProcessorService } from './quiz-file-processor.service';
import { VisionOcrService } from './vision-ocr.service';
import { KnowledgeFusionService } from './knowledge-fusion.service';

@Module({
  imports: [QuizzesModule, QuestionsModule],
  providers: [
    AiQuizService,
    FfmpegService,
    WhisperService,
    ParserService,
    AiContentGeneratorService,
    QuizFileProcessorService,
    VisionOcrService,
    KnowledgeFusionService,
  ],
  controllers: [AiQuizController],
})
export class AiQuizModule {}
