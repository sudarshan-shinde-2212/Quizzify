import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
export declare class QuizzesController {
    private quizzesService;
    constructor(quizzesService: QuizzesService);
    create(dto: CreateQuizDto, user: any): Promise<import("../entities/quiz.entity").Quiz>;
    findAll(): Promise<import("../entities/quiz.entity").Quiz[]>;
    findOne(id: string): Promise<import("../entities/quiz.entity").Quiz>;
    update(id: string, dto: UpdateQuizDto): Promise<import("../entities/quiz.entity").Quiz>;
    remove(id: string): Promise<void>;
    publish(id: string, dto: PublishQuizDto): Promise<import("../entities/quiz.entity").Quiz>;
}
