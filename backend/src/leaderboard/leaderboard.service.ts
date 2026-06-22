import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { QuizResult } from '../entities/quiz-result.entity';
import { Visibility } from '../common/enums/visibility.enum';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(QuizResult) private resultRepo: Repository<QuizResult>,
  ) {}

  async getPublicQuizzes() {
    return this.quizRepo.find({
      where: { visibility: Visibility.PUBLIC, isPublished: true },
      order: { createdAt: 'DESC' },
      select: ['id', 'title'],
    });
  }

  private calculateCompletionTime(startedAt: Date, submittedAt?: Date): number | null {
    if (!submittedAt) {
      return null;
    }
    const diffMs = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
    return Math.floor(diffMs / 1000);
  }

  async getLeaderboard(quizId?: string) {
    const publicQuizzes = await this.getPublicQuizzes();
    if (publicQuizzes.length === 0) {
      return {
        publicQuizzes: [],
        currentQuizId: null,
        currentQuizTitle: null,
        leaderboard: [],
      };
    }

    let selectedQuiz: Quiz | undefined;
    if (quizId) {
      selectedQuiz = publicQuizzes.find((q) => q.id === quizId);
    }
    if (!selectedQuiz) {
      selectedQuiz = publicQuizzes[0];
    }

    const leaderboardData = await this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.student', 'student')
      .leftJoinAndSelect('result.attempt', 'attempt')
      .where('result.quizId = :quizId', { quizId: selectedQuiz.id })
      .orderBy('result.score', 'DESC')
      .addOrderBy('result.percentage', 'DESC')
      .addOrderBy('attempt.submittedAt', 'ASC')
      .getMany();

    const leaderboard = leaderboardData.map((res, index) => ({
      rank: index + 1,
      studentName: res.student.fullName || 'Anonymous',
      score: res.score,
      percentage: res.percentage,
      attemptDate: res.attempt.submittedAt || res.attempt.startedAt,
      completionTimeSeconds: this.calculateCompletionTime(
        res.attempt.startedAt,
        res.attempt.submittedAt
      ),
    }));

    return {
      publicQuizzes,
      currentQuizId: selectedQuiz.id,
      currentQuizTitle: selectedQuiz.title,
      leaderboard,
    };
  }
}
