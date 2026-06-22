import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
  ) {}

  private validateMarks(marks?: number) {
    if (marks !== undefined) {
      if (marks !== 0.5 && !Number.isInteger(marks)) {
        throw new BadRequestException('Question marks must be 0.5 or a whole number.');
      }
    }
  }

  private async assertQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async create(quizId: string, dto: CreateQuestionDto): Promise<Question> {
    await this.assertQuiz(quizId);
    this.validateMarks(dto.marks);
    const question = this.questionRepo.create({ ...dto, quizId });
    return this.questionRepo.save(question);
  }

  async bulkCreate(quizId: string, dtos: CreateQuestionDto[]): Promise<Question[]> {
    await this.assertQuiz(quizId);
    for (const dto of dtos) {
      this.validateMarks(dto.marks);
    }
    const questions = dtos.map((dto) => this.questionRepo.create({ ...dto, quizId }));
    return this.questionRepo.save(questions);
  }

  async findByQuiz(quizId: string): Promise<Question[]> {
    await this.assertQuiz(quizId);
    return this.questionRepo.find({ where: { quizId }, order: { createdAt: 'ASC' } });
  }

  async search(query: string) {
    return this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.quiz', 'quiz')
      .where('question.text ILIKE :query', { query: `%${query}%` })
      .orWhere('quiz.title ILIKE :query', { query: `%${query}%` })
      .orWhere('question.difficulty ILIKE :query', { query: `%${query}%` })
      .getMany();
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    this.validateMarks(dto.marks);
    Object.assign(question, dto);
    return this.questionRepo.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    await this.questionRepo.remove(question);
  }
}
