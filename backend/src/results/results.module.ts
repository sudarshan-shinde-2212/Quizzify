import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { QuizResult } from '../entities/quiz-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuizResult])],
  providers: [ResultsService],
  controllers: [ResultsController],
})
export class ResultsModule {}
