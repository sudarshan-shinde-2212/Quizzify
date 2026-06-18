import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
export declare class QuizzesService {
    private quizRepo;
    constructor(quizRepo: Repository<Quiz>);
    create(dto: CreateQuizDto, adminId: string): Promise<Quiz>;
    findAll(): Promise<Quiz[]>;
    findOne(id: string): Promise<Quiz>;
    update(id: string, dto: UpdateQuizDto): Promise<Quiz>;
    remove(id: string): Promise<void>;
    publish(id: string, dto: PublishQuizDto): Promise<Quiz>;
    findActiveQuizzes(): Promise<Quiz[]>;
    findOneActive(id: string): Promise<Quiz>;
    private parseDateRange;
}
