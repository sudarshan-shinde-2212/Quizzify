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
exports.QuizzesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quiz_entity_1 = require("../entities/quiz.entity");
let QuizzesService = class QuizzesService {
    constructor(quizRepo) {
        this.quizRepo = quizRepo;
    }
    async create(dto, adminId) {
        if (!adminId) {
            throw new common_1.BadRequestException('Admin ID is required');
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
    async findAll() {
        return this.quizRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const quiz = await this.quizRepo.findOne({
            where: { id },
            relations: ['questions'],
        });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        return quiz;
    }
    async update(id, dto) {
        const quiz = await this.findOne(id);
        const { startDate, endDate, ...rest } = dto;
        const updateData = { ...rest };
        if (startDate || endDate) {
            const { start, end } = this.parseDateRange(startDate ?? quiz.startDate.toISOString(), endDate ?? quiz.endDate.toISOString());
            updateData.startDate = start;
            updateData.endDate = end;
        }
        Object.assign(quiz, updateData);
        return this.quizRepo.save(quiz);
    }
    async remove(id) {
        const quiz = await this.findOne(id);
        await this.quizRepo.remove(quiz);
    }
    async publish(id, dto) {
        const quiz = await this.findOne(id);
        quiz.isPublished = dto.isPublished;
        return this.quizRepo.save(quiz);
    }
    async findActiveQuizzes() {
        const now = new Date();
        return this.quizRepo.find({
            where: {
                isPublished: true,
                startDate: (0, typeorm_2.LessThanOrEqual)(now),
                endDate: (0, typeorm_2.MoreThanOrEqual)(now),
            },
            order: { startDate: 'ASC' },
        });
    }
    async findOneActive(id) {
        const now = new Date();
        const quiz = await this.quizRepo.findOne({
            where: {
                id,
                isPublished: true,
                startDate: (0, typeorm_2.LessThanOrEqual)(now),
                endDate: (0, typeorm_2.MoreThanOrEqual)(now),
            },
            relations: ['questions'],
        });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found or not active');
        return quiz;
    }
    parseDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Invalid startDate or endDate');
        }
        if (start >= end) {
            throw new common_1.BadRequestException('startDate must be before endDate');
        }
        return { start, end };
    }
};
exports.QuizzesService = QuizzesService;
exports.QuizzesService = QuizzesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quiz_entity_1.Quiz)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuizzesService);
//# sourceMappingURL=quizzes.service.js.map