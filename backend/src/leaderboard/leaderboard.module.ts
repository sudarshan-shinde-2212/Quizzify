import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { Quiz } from '../entities/quiz.entity';
import { QuizResult } from '../entities/quiz-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, QuizResult])],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
