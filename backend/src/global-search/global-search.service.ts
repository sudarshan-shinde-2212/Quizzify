import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class GlobalSearchService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  async search(query: string) {
    const students = await this.studentRepo.find({
      where: [
        { fullName: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      take: 10,
    });

    const quizzes = await this.quizRepo.find({
      where: [
        { title: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
      take: 10,
    });

    const questions = await this.questionRepo.find({
      where: [
        { text: ILike(`%${query}%`) },
        { optionA: ILike(`%${query}%`) },
        { optionB: ILike(`%${query}%`) },
        { optionC: ILike(`%${query}%`) },
        { optionD: ILike(`%${query}%`) },
      ],
      take: 10,
    });

    return {
      users: students.map((s) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
      })),
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
      })),
      questions: questions.map((q) => ({
        id: q.id,
        quizId: q.quizId,
        text: q.text,
      })),
    };
  }
}
