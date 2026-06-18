import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
export declare class QuestionsService {
    private questionRepo;
    private quizRepo;
    constructor(questionRepo: Repository<Question>, quizRepo: Repository<Quiz>);
    private assertQuiz;
    create(quizId: string, dto: CreateQuestionDto): Promise<Question>;
    bulkCreate(quizId: string, dtos: CreateQuestionDto[]): Promise<Question[]>;
    findByQuiz(quizId: string): Promise<Question[]>;
    update(id: string, dto: UpdateQuestionDto): Promise<Question>;
    remove(id: string): Promise<void>;
}
