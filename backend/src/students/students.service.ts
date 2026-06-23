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

    results.forEach((res) => {
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

    return results.map((res) => ({
      quizName: res.quiz.title,
      dateAttempted: res.attempt.submittedAt || res.attempt.startedAt,
      score: res.score,
      percentage: res.percentage,
      correctAnswers: res.correctAnswers,
      wrongAnswers: res.wrongAnswers,
      status: res.cheatingDetected ? 'Cheating Detected' : (res.percentage !== null && res.percentage >= 50 ? 'Pass' : 'Fail'),
    }));
  }
}
