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
      .andWhere('result.cheatingDetected = :cheatingDetected', { cheatingDetected: false })
      .getMany();

    const transformedData = leaderboardData.map((res) => ({
      studentName: res.student.fullName || 'Anonymous',
      score: res.score as number,
      percentage: res.percentage as number,
      attemptDate: res.attempt.submittedAt || res.attempt.startedAt,
      completionTimeSeconds: this.calculateCompletionTime(
        res.attempt.startedAt,
        res.attempt.submittedAt
      ),
    }));

    // Sort the data: primary by percentage (descending), then by completion time (ascending)
    transformedData.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      // If percentages are equal, sort by completion time ascending (faster first)
      if (a.completionTimeSeconds === null) return 1;
      if (b.completionTimeSeconds === null) return -1;
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });

    const leaderboard = transformedData.map((res, index) => ({
      rank: index + 1,
      ...res,
    }));

    return {
      publicQuizzes,
      currentQuizId: selectedQuiz.id,
      currentQuizTitle: selectedQuiz.title,
      leaderboard,
    };
  }
}
