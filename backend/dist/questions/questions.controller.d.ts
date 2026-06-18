import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BulkCreateQuestionDto } from './dto/bulk-create-question.dto';
export declare class QuestionsController {
    private questionsService;
    constructor(questionsService: QuestionsService);
    create(quizId: string, dto: CreateQuestionDto): Promise<import("../entities/question.entity").Question>;
    bulkCreate(quizId: string, dto: BulkCreateQuestionDto): Promise<import("../entities/question.entity").Question[]>;
    findAll(quizId: string): Promise<import("../entities/question.entity").Question[]>;
    update(id: string, dto: UpdateQuestionDto): Promise<import("../entities/question.entity").Question>;
    remove(id: string): Promise<void>;
}
