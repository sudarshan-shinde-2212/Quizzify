import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizResult } from '../entities/quiz-result.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(QuizResult) private resultRepo: Repository<QuizResult>,
  ) {}

  async getStudentResults(studentId: string): Promise<QuizResult[]> {
    return this.resultRepo.find({
      where: { studentId },
      relations: ['quiz', 'attempt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStudentResultByQuiz(studentId: string, quizId: string): Promise<QuizResult> {
    const result = await this.resultRepo.findOne({
      where: { studentId, quizId },
      relations: ['quiz', 'attempt'],
    });
    if (!result) throw new NotFoundException('Result not found');
    return result;
  }

  async getAllResults(): Promise<QuizResult[]> {
    return this.resultRepo.find({
      relations: ['student', 'quiz', 'attempt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getResultsByQuiz(quizId: string): Promise<QuizResult[]> {
    return this.resultRepo.find({
      where: { quizId },
      relations: ['student', 'quiz', 'attempt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getResultsByStudent(studentId: string): Promise<QuizResult[]> {
    return this.resultRepo.find({
      where: { studentId },
      relations: ['student', 'quiz', 'attempt'],
      order: { createdAt: 'DESC' },
    });
  }
}
