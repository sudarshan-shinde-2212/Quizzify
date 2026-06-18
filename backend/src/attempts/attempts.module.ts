import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAnswer } from '../entities/quiz-answer.entity';
import { QuizResult } from '../entities/quiz-result.entity';
import { Question } from '../entities/question.entity';
import { QuizzesModule } from '../quizzes/quizzes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizAttempt, QuizAnswer, QuizResult, Question]),
    QuizzesModule,
  ],
  providers: [AttemptsService],
  controllers: [AttemptsController],
})
export class AttemptsModule {}
