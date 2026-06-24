import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { QuizResult } from '../entities/quiz-result.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(QuizResult) private resultRepo: Repository<QuizResult>,
    @InjectRepository(QuizAttempt) private attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
  ) {}

  async completeProfile(studentId: string, dto: CompleteProfileDto) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    Object.assign(student, { ...dto, profileCompleted: true });
    return this.studentRepo.save(student);
  }

  async findById(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findAll() {
    return this.studentRepo.find({ order: { createdAt: 'DESC' } });
  }

  async search(query: string) {
    return this.studentRepo.find({
      where: [
        { fullName: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserDetails(studentId: string) {
    const student = await this.findById(studentId);
    const results = await this.resultRepo.find({
      where: { studentId },
      relations: { attempt: true },
    });

    const totalAttempted = results.length;
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = Infinity;
    let validResultCount = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDisqualified = 0;

    results.forEach((res) => {
      const passingScore = 35;
      const isCheating = res.cheatingDetected || res.attempt.isCheating;
      const passed = !isCheating && res.percentage !== null && res.percentage >= passingScore;

      if (isCheating) {
        totalDisqualified++;
      } else if (passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }

      if (res.score !== null) {
        validResultCount++;
        totalScore += res.score;
        if (res.score > highestScore) highestScore = res.score;
        if (res.score < lowestScore) lowestScore = res.score;
      }
    });

    const averageScore = validResultCount > 0 ? totalScore / validResultCount : 0;

    // Find last activity
    let lastActivity = student.createdAt;
    if (results.length > 0) {
      lastActivity = results
        .map((res) => res.attempt.submittedAt || res.attempt.startedAt)
        .sort((a, b) => b.getTime() - a.getTime())[0];
    }

    return {
      student,
      stats: {
        totalQuizzesAttempted: totalAttempted,
        totalPassed,
        totalFailed,
        totalDisqualified,
        averageScore: Number(averageScore.toFixed(2)),
        highestScore,
        lowestScore: lowestScore === Infinity ? 0 : lowestScore,
        lastActivity,
      },
    };
  }

  async getUserHistory(studentId: string, search?: string, sortBy?: 'date' | 'score', sortOrder?: 'ASC' | 'DESC') {
    const queryBuilder = this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.attempt', 'attempt')
      .leftJoinAndSelect('result.quiz', 'quiz')
      .where('result.studentId = :studentId', { studentId });

    if (search) {
      queryBuilder.andWhere('quiz.title ILIKE :search', { search: `%${search}%` });
    }

    const order = sortOrder || 'DESC';
    if (sortBy === 'score') {
      queryBuilder.orderBy('result.score', order);
    } else {
      queryBuilder.orderBy('attempt.submittedAt', order);
    }

    const results = await queryBuilder.getMany();

    // Group by quiz to calculate attempt number
    const quizAttemptMap = new Map<string, number>();
    // First pass: count total attempts per quiz
    results.forEach(res => {
      const quizId = res.quizId;
      quizAttemptMap.set(quizId, (quizAttemptMap.get(quizId) || 0) + 1);
    });

    // Second pass: assign attempt numbers (reverse order to get 1 as first attempt)
    const quizAttemptCounter = new Map<string, number>();
    const sortedByQuizAndDate = [...results].sort((a, b) => {
      if (a.quizId !== b.quizId) return a.quizId.localeCompare(b.quizId);
      return (a.attempt.submittedAt || a.attempt.startedAt).getTime() - (b.attempt.submittedAt || b.attempt.startedAt).getTime();
    });

    sortedByQuizAndDate.forEach(res => {
      const quizId = res.quizId;
      const current = quizAttemptCounter.get(quizId) || 0;
      quizAttemptCounter.set(quizId, current + 1);
    });

    return results.map((res) => {
      const passingScore = 35;
      const isCheating = res.cheatingDetected || res.attempt.isCheating;
      const passed = !isCheating && res.percentage !== null && res.percentage >= passingScore;
      const attemptNumber = quizAttemptCounter.get(res.quizId)!;
      quizAttemptCounter.set(res.quizId, attemptNumber - 1);

      // Calculate completion time
      let completionTimeSeconds: number | null = null;
      if (res.attempt.startedAt && res.attempt.submittedAt) {
        completionTimeSeconds = Math.round((res.attempt.submittedAt.getTime() - res.attempt.startedAt.getTime()) / 1000);
      }

      return {
        id: res.id,
        quizId: res.quizId,
        quizName: res.quiz.title,
        attemptNumber,
        isRetake: attemptNumber > 1,
        score: isCheating ? null : res.score,
        percentage: isCheating ? null : res.percentage,
        correctAnswers: isCheating ? null : res.correctAnswers,
        wrongAnswers: isCheating ? null : res.wrongAnswers,
        status: isCheating ? 'Disqualified' : (passed ? 'Passed' : 'Failed'),
        startedAt: res.attempt.startedAt,
        submittedAt: res.attempt.submittedAt,
        completionTimeSeconds,
        hideResultDetails: res.quiz.hideResultDetails,
        allowReviewAfterSubmission: res.quiz.allowReviewAfterSubmission,
      };
    });
  }
}
