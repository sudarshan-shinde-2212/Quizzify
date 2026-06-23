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

  // Helper function to check if a quiz is currently active in IST
  private isQuizActive(quiz: { startDate: Date; endDate: Date }): boolean {
    const now = new Date();
    // Get current time components in IST
    const nowIST = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
    const [nowDatePart, nowTimePart] = nowIST.split(', ');
    const [nowDay, nowMonth, nowYear] = nowDatePart.split('/').map(Number);
    const [nowHour, nowMinute, nowSecond] = nowTimePart.split(':').map(Number);
    const nowISTDate = new Date(nowYear, nowMonth - 1, nowDay, nowHour, nowMinute, nowSecond);

    // Convert quiz startDate to IST
    const startIST = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(quiz.startDate);
    const [startDatePart, startTimePart] = startIST.split(', ');
    const [startDay, startMonth, startYear] = startDatePart.split('/').map(Number);
    const [startHour, startMinute, startSecond] = startTimePart.split(':').map(Number);
    const startISTDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, startSecond);

    // Convert quiz endDate to IST, and set to 23:59:59 to include entire end day
    const endIST = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(quiz.endDate);
    const [endDatePart, endTimePart] = endIST.split(', ');
    const [endDay, endMonth, endYear] = endDatePart.split('/').map(Number);
    // Set end time to 23:59:59 to cover the entire end date
    const endISTDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);

    return nowISTDate >= startISTDate && nowISTDate <= endISTDate;
  }

  async getQuizSettings(id: string) {
    const quiz = await this.findOne(id);
    return {
      allowRetakes: quiz.allowRetakes,
      maxRetakes: quiz.maxRetakes,
      passingScore: quiz.passingScore,
      shuffleQuestions: quiz.shuffleQuestions,
    };
  }

  async updateQuizSettings(id: string, dto: UpdateQuizSettingsDto) {
    const quiz = await this.findOne(id);
    if (dto.allowRetakes !== undefined) {
      quiz.allowRetakes = dto.allowRetakes;
      if (!dto.allowRetakes) {
        quiz.maxRetakes = 0;
      }
    }
    if (dto.maxRetakes !== undefined) {
      quiz.maxRetakes = dto.maxRetakes;
    }
    if (dto.passingScore !== undefined) {
      quiz.passingScore = dto.passingScore;
    }
    if (dto.shuffleQuestions !== undefined) quiz.shuffleQuestions = dto.shuffleQuestions;
    await this.quizRepo.save(quiz);
    return {
      allowRetakes: quiz.allowRetakes,
      maxRetakes: quiz.maxRetakes,
      passingScore: quiz.passingScore,
      shuffleQuestions: quiz.shuffleQuestions,
    };
  }

  async findActiveQuizzes(): Promise<Quiz[]> {
    // Get all published quizzes first
    const allPublishedQuizzes = await this.quizRepo.find({
      where: { isPublished: true },
      order: { startDate: 'ASC' },
    });
    // Filter active ones using IST timezone logic
    return allPublishedQuizzes.filter(quiz => this.isQuizActive(quiz));
  }

  async findOneActive(id: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id, isPublished: true },
      relations: ['questions'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (!this.isQuizActive(quiz)) {
      throw new NotFoundException('This quiz has expired and is no longer available.');
    }
    return quiz;
  }

  async getQuizStats(quizId: string) {
    const quiz = await this.findOne(quizId);
    const results = await this.resultRepo.find({
      where: { quizId, cheatingDetected: false },
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
    let validResultCount = 0;

    results.forEach((res) => {
      if (res.score !== null && res.percentage !== null) {
        validResultCount++;
        totalScore += res.score;
        if (res.score > highestScore) highestScore = res.score;
        if (res.score < lowestScore) lowestScore = res.score;
        if (res.percentage >= 50) passCount++;
        else failCount++;
      }
    });

    const averageScore = validResultCount > 0 ? totalScore / validResultCount : 0;
    const passPercentage = validResultCount > 0 ? (passCount / validResultCount) * 100 : 0;

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
      .where('result.quizId = :quizId', { quizId })
      .andWhere('result.cheatingDetected = false');

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
