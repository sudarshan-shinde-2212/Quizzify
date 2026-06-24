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

  // Helper function to get date/time parts in a specific timezone
  private getDatePartsInTimezone(date: Date, timeZone: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

    return {
      year: getPart('year'),
      month: getPart('month') - 1, // months are 0-indexed for Date.UTC
      day: getPart('day'),
      hour: getPart('hour'),
      minute: getPart('minute'),
      second: getPart('second'),
    };
  }

  // Helper function to check if a quiz is currently active in IST
  private isQuizActive(quiz: { id?: string; startDate: Date; endDate: Date }): boolean {
    const nowUtc = new Date();

    // Get all date/time parts in IST timezone
    const nowParts = this.getDatePartsInTimezone(nowUtc, 'Asia/Kolkata');
    const startParts = this.getDatePartsInTimezone(quiz.startDate, 'Asia/Kolkata');
    const endParts = this.getDatePartsInTimezone(quiz.endDate, 'Asia/Kolkata');

    // Now create Date objects using UTC time (to avoid server timezone issues
    const nowISTTimestamp = Date.UTC(nowParts.year, nowParts.month, nowParts.day, nowParts.hour, nowParts.minute, nowParts.second);
    const startISTTimestamp = Date.UTC(startParts.year, startParts.month, startParts.day, startParts.hour, startParts.minute, startParts.second);
    const endISTTimestamp = Date.UTC(endParts.year, endParts.month, endParts.day, 23, 59, 59); // extend end date to 23:59:59 IST

    // Now create actual Date objects for logging
    const nowIST = new Date(nowISTTimestamp);
    const startIST = new Date(startISTTimestamp);
    const endIST = new Date(endISTTimestamp);

    console.log(`[QUIZ EXPIRY CHECK] Quiz ID: ${quiz.id || 'N/A'}`);
    console.log(`  Current UTC Time: ${nowUtc.toISOString()}`);
    console.log(`  Current IST (as UTC): ${nowIST.toISOString()}`);
    console.log(`  Quiz Start (IST as UTC): ${startIST.toISOString()}`);
    console.log(`  Quiz End (IST as UTC, 23:59:59): ${endIST.toISOString()}`);

    const isActive = nowISTTimestamp >= startISTTimestamp && nowISTTimestamp <= endISTTimestamp;
    console.log(`  Is Active: ${isActive}`);

    return isActive;
  }

  async getQuizSettings(id: string) {
    const quiz = await this.findOne(id);
    return {
      allowRetakes: quiz.allowRetakes,
      maxRetakes: quiz.maxRetakes,
      shuffleQuestions: quiz.shuffleQuestions,
      hideResultDetails: quiz.hideResultDetails,
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
    if (dto.shuffleQuestions !== undefined) quiz.shuffleQuestions = dto.shuffleQuestions;
    if (dto.hideResultDetails !== undefined) quiz.hideResultDetails = dto.hideResultDetails;
    await this.quizRepo.save(quiz);
    return {
      allowRetakes: quiz.allowRetakes,
      maxRetakes: quiz.maxRetakes,
      shuffleQuestions: quiz.shuffleQuestions,
      hideResultDetails: quiz.hideResultDetails,
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
        if (res.percentage >= 35) passCount++;
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
