"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_entity_1 = require("../entities/question.entity");
const quiz_entity_1 = require("../entities/quiz.entity");
let QuestionsService = class QuestionsService {
    constructor(questionRepo, quizRepo) {
        this.questionRepo = questionRepo;
        this.quizRepo = quizRepo;
    }
    async assertQuiz(quizId) {
        const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        return quiz;
    }
    async create(quizId, dto) {
        await this.assertQuiz(quizId);
        const question = this.questionRepo.create({ ...dto, quizId });
        return this.questionRepo.save(question);
    }
    async bulkCreate(quizId, dtos) {
        await this.assertQuiz(quizId);
        const questions = dtos.map((dto) => this.questionRepo.create({ ...dto, quizId }));
        return this.questionRepo.save(questions);
    }
    async findByQuiz(quizId) {
        await this.assertQuiz(quizId);
        return this.questionRepo.find({ where: { quizId }, order: { createdAt: 'ASC' } });
    }
    async update(id, dto) {
        const question = await this.questionRepo.findOne({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        Object.assign(question, dto);
        return this.questionRepo.save(question);
    }
    async remove(id) {
        const question = await this.questionRepo.findOne({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        await this.questionRepo.remove(question);
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(quiz_entity_1.Quiz)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map