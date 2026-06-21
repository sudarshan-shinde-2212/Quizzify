import { Module } from '@nestjs/common';
import { AiQuizService } from './ai-quiz.service';
import { AiQuizController } from './ai-quiz.controller';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [QuizzesModule, QuestionsModule],
  providers: [AiQuizService],
  controllers: [AiQuizController],
})
export class AiQuizModule {}
