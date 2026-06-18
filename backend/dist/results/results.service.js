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
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quiz_result_entity_1 = require("../entities/quiz-result.entity");
let ResultsService = class ResultsService {
    constructor(resultRepo) {
        this.resultRepo = resultRepo;
    }
    async getStudentResults(studentId) {
        return this.resultRepo.find({
            where: { studentId },
            relations: ['quiz'],
            order: { createdAt: 'DESC' },
        });
    }
    async getStudentResultByQuiz(studentId, quizId) {
        const result = await this.resultRepo.findOne({
            where: { studentId, quizId },
            relations: ['quiz'],
        });
        if (!result)
            throw new common_1.NotFoundException('Result not found');
        return result;
    }
    async getAllResults() {
        return this.resultRepo.find({
            relations: ['student', 'quiz'],
            order: { createdAt: 'DESC' },
        });
    }
    async getResultsByQuiz(quizId) {
        return this.resultRepo.find({
            where: { quizId },
            relations: ['student', 'quiz'],
            order: { createdAt: 'DESC' },
        });
    }
    async getResultsByStudent(studentId) {
        return this.resultRepo.find({
            where: { studentId },
            relations: ['student', 'quiz'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quiz_result_entity_1.QuizResult)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ResultsService);
//# sourceMappingURL=results.service.js.map