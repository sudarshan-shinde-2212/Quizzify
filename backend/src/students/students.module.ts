import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from '../entities/student.entity';
import { QuizResult } from '../entities/quiz-result.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, QuizResult, QuizAttempt, Quiz])],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}
