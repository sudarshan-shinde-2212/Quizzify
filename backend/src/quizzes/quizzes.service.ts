import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
  ) {}

  async create(dto: CreateQuizDto, adminId: string): Promise<Quiz> {
    if (!adminId) {
      throw new BadRequestException('Admin ID is required');
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
    quiz.isPublished = dto.isPublished;
    return this.quizRepo.save(quiz);
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

  private parseDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return { start, end };
  }
}
