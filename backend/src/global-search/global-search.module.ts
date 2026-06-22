import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchController } from './global-search.controller';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question, Student])],
  providers: [GlobalSearchService],
  controllers: [GlobalSearchController],
})
export class GlobalSearchModule {}
