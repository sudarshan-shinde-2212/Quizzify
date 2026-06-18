import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Quiz])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
