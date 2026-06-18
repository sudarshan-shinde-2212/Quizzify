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
exports.AttemptsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quiz_attempt_entity_1 = require("../entities/quiz-attempt.entity");
const quiz_answer_entity_1 = require("../entities/quiz-answer.entity");
const quiz_result_entity_1 = require("../entities/quiz-result.entity");
const question_entity_1 = require("../entities/question.entity");
const quizzes_service_1 = require("../quizzes/quizzes.service");
let AttemptsService = class AttemptsService {
    constructor(attemptRepo, answerRepo, resultRepo, questionRepo, quizzesService) {
        this.attemptRepo = attemptRepo;
        this.answerRepo = answerRepo;
        this.resultRepo = resultRepo;
        this.questionRepo = questionRepo;
        this.quizzesService = quizzesService;
    }
    async startQuiz(studentId, quizId) {
        await this.quizzesService.findOneActive(quizId);
        const existing = await this.attemptRepo.findOne({
            where: { studentId, quizId },
        });
        if (existing) {
            throw new common_1.ConflictException('Quiz already attempted');
        }
        const attempt = this.attemptRepo.create({
            studentId,
            quizId,
            startedAt: new Date(),
        });
        return this.attemptRepo.save(attempt);
    }
    async submitQuiz(studentId, quizId, dto) {
        const quiz = await this.quizzesService.findOneActive(quizId);
        const attempt = await this.attemptRepo.findOne({
            where: { studentId, quizId },
        });
        if (!attempt)
            throw new common_1.NotFoundException('Quiz not started');
        if (attempt.isSubmitted)
            throw new common_1.ConflictException('Quiz already submitted');
        const now = new Date();
        const deadline = new Date(attempt.startedAt.getTime() + quiz.durationInMinutes * 60 * 1000);
        if (now > deadline) {
            throw new common_1.BadRequestException('Quiz duration exceeded. Submission rejected.');
        }
        const questions = await this.questionRepo.find({ where: { quizId } });
        if (!questions.length)
            throw new common_1.NotFoundException('No questions found for quiz');
        const questionMap = new Map(questions.map((q) => [q.id, q]));
        const answerEntities = dto.answers
            .filter((a) => questionMap.has(a.questionId))
            .map((a) => this.answerRepo.create({
            attemptId: attempt.id,
            questionId: a.questionId,
            selectedOption: a.selectedOption,
        }));
        await this.answerRepo.save(answerEntities);
        const totalQuestions = questions.length;
        const attemptedQuestions = answerEntities.length;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let score = 0;
        for (const answer of answerEntities) {
            const question = questionMap.get(answer.questionId);
            if (!question)
                continue;
            if (answer.selectedOption === question.correctOption) {
                correctAnswers++;
                score += Number(question.marks);
            }
            else {
                wrongAnswers++;
                score -= Number(question.negativeMarks);
            }
        }
        if (score < 0)
            score = 0;
        const maxScore = questions.reduce((sum, q) => sum + Number(q.marks), 0);
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        attempt.isSubmitted = true;
        attempt.submittedAt = now;
        await this.attemptRepo.save(attempt);
        const result = this.resultRepo.create({
            attemptId: attempt.id,
            studentId,
            quizId,
            totalQuestions,
            attemptedQuestions,
            correctAnswers,
            wrongAnswers,
            score: parseFloat(score.toFixed(2)),
            percentage: parseFloat(percentage.toFixed(2)),
        });
        await this.resultRepo.save(result);
        return {
            score: result.score,
            percentage: result.percentage,
            correctAnswers: result.correctAnswers,
            wrongAnswers: result.wrongAnswers,
            totalQuestions: result.totalQuestions,
        };
    }
};
exports.AttemptsService = AttemptsService;
exports.AttemptsService = AttemptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quiz_attempt_entity_1.QuizAttempt)),
    __param(1, (0, typeorm_1.InjectRepository)(quiz_answer_entity_1.QuizAnswer)),
    __param(2, (0, typeorm_1.InjectRepository)(quiz_result_entity_1.QuizResult)),
    __param(3, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        quizzes_service_1.QuizzesService])
], AttemptsService);
//# sourceMappingURL=attempts.service.js.map