import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Not, ILike } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { UpdateQuizSettingsDto } from './dto/update-quiz-settings.dto';
import { QuizResult } from '../entities/quiz-result.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(QuizResult) private resultRepo: Repository<QuizResult>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  async create(dto: CreateQuizDto, adminId: string): Promise<Quiz> {
    if (!adminId) {
      throw new BadRequestException('Admin ID is required');
    }

    // Duplicate title check
    const existing = await this.quizRepo.findOne({ where: { title: dto.title } });
    if (existing) {
      throw new ConflictException('A quiz with this title already exists.');
    }

    const { start, end } = this.parseDateRange(dto.startDate, dto.endDate);
    const quiz = this.quizRepo.create({
      ...dto,
      startDate: start,
      endDate: end,
      createdById: adminId,
    });
    return this.quizRepo.save(quiz);
  }


  async findAll(): Promise<Quiz[]> {
    return this.quizRepo.find({ order: { createdAt: 'DESC' } });
  }

  async search(query: string) {
    return this.quizRepo.find({
      where: [
        { title: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['questions'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);

    // Duplicate title check (ignore current quiz)
    if (dto.title && dto.title !== quiz.title) {
      const titleConflict = await this.quizRepo.findOne({
        where: { title: dto.title },
      });
      if (titleConflict && titleConflict.id !== id) {
        throw new ConflictException('A quiz with this title already exists.');
      }
    }

    const { startDate, endDate, ...rest } = dto;
    const updateData: Partial<Quiz> = { ...rest };

    if (startDate || endDate) {
      const { start, end } = this.parseDateRange(
        startDate ?? quiz.startDate.toISOString(),
        endDate ?? quiz.endDate.toISOString(),
      );
      updateData.startDate = start;
      updateData.endDate = end;
    }

    Object.assign(quiz, updateData);
    return this.quizRepo.save(quiz);
  }

  async remove(id: string): Promise<void> {
    const quiz = await this.findOne(id);
    await this.quizRepo.remove(quiz);
  }

  async publish(id: string, dto: PublishQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    if (dto.isPublished) {
      if (!quiz.questions || quiz.questions.length === 0) {
        throw new BadRequestException('Quiz cannot be published with zero questions.');
      }
      if (quiz.questions.length !== quiz.questionCount) {
        throw new BadRequestException(`Question count mismatch. Expected ${quiz.questionCount} but found ${quiz.questions.length}.`);
      }
      
      const sumMarks = quiz.questions.reduce((acc, q) => acc + Number(q.marks), 0);
      if (sumMarks !== Number(quiz.totalMarks)) {
        throw new BadRequestException(`Total marks mismatch. Quiz total is ${quiz.totalMarks}, but questions sum to ${sumMarks}.`);
      }
    }

    quiz.isPublished = dto.isPublished;
    return this.quizRepo.save(quiz);
  }

  async updateVisibility(id: string, dto: UpdateVisibilityDto): Promise<Quiz> {
    const quiz = await this.findOne(id);
    quiz.visibility = dto.visibility;
    return this.quizRepo.save(quiz);
  }

  async getQuizSettings(id: string) {
    const quiz = await this.findOne(id);
    return {
      allowRetakes: quiz.allowRetakes,
      shuffleQuestions: quiz.shuffleQuestions,
    };
  }

  async updateQuizSettings(id: string, dto: UpdateQuizSettingsDto) {
    const quiz = await this.findOne(id);
    if (dto.allowRetakes !== undefined) quiz.allowRetakes = dto.allowRetakes;
    if (dto.shuffleQuestions !== undefined) quiz.shuffleQuestions = dto.shuffleQuestions;
    await this.quizRepo.save(quiz);
    return {
      allowRetakes: quiz.allowRetakes,
      shuffleQuestions: quiz.shuffleQuestions,
    };
  }

  async findActiveQuizzes(): Promise<Quiz[]> {
    const now = new Date();
    return this.quizRepo.find({
      where: {
        isPublished: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { startDate: 'ASC' },
    });
  }

  async findOneActive(id: string): Promise<Quiz> {
    const now = new Date();
    const quiz = await this.quizRepo.findOne({
      where: {
        id,
        isPublished: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['questions'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found or not active');
    return quiz;
  }

  async getQuizStats(quizId: string) {
    const quiz = await this.findOne(quizId);
    const results = await this.resultRepo.find({
      where: { quizId },
      relations: { attempt: true, student: true },
    });

    const studentSet = new Set(results.map((res) => res.studentId));
    const totalStudentsAttempted = studentSet.size;
    const totalAttempts = results.length;

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = Infinity;
    let passCount = 0;
    let failCount = 0;

    results.forEach((res) => {
      totalScore += res.score;
      if (res.score > highestScore) highestScore = res.score;
      if (res.score < lowestScore) lowestScore = res.score;
      if (res.percentage >= 50) passCount++;
      else failCount++;
    });

    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    const passPercentage = totalAttempts > 0 ? (passCount / totalAttempts) * 100 : 0;

    return {
      overview: {
        quizName: quiz.title,
        totalQuestions: quiz.questionCount,
        publishedStatus: quiz.isPublished,
        creationDate: quiz.createdAt,
      },
      participation: {
        totalStudentsAttempted,
        totalAttempts,
        completionRate: totalStudentsAttempted > 0 ? 100 : 0, // all attempts are completed
      },
      performance: {
        averageScore: Number(averageScore.toFixed(2)),
        highestScore,
        lowestScore: lowestScore === Infinity ? 0 : lowestScore,
        passCount,
        failCount,
        passPercentage: Number(passPercentage.toFixed(2)),
      },
    };
  }

  async getQuizResults(
    quizId: string,
    search?: string,
    sortBy?: 'date' | 'score',
    sortOrder?: 'ASC' | 'DESC',
  ) {
    const queryBuilder = this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.student', 'student')
      .leftJoinAndSelect('result.attempt', 'attempt')
      .where('result.quizId = :quizId', { quizId });

    if (search) {
      queryBuilder.andWhere('(student.fullName ILIKE :search OR student.email ILIKE :search)', { search: `%${search}%` });
    }

    const order = sortOrder || 'DESC';
    if (sortBy === 'score') {
      queryBuilder.orderBy('result.score', order);
    } else {
      queryBuilder.orderBy('attempt.submittedAt', order);
    }

    const results = await queryBuilder.getMany();

    return results.map((res) => ({
      studentName: res.student.fullName || 'Anonymous',
      email: res.student.email,
      score: res.score,
      percentage: res.percentage,
      attemptDate: res.attempt.submittedAt || res.attempt.startedAt,
    }));
  }

  private parseDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    if (start > end) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    return { start, end };
  }
}
