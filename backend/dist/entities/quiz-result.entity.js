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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizResult = void 0;
const typeorm_1 = require("typeorm");
const quiz_attempt_entity_1 = require("./quiz-attempt.entity");
const student_entity_1 = require("./student.entity");
const quiz_entity_1 = require("./quiz.entity");
let QuizResult = class QuizResult {
};
exports.QuizResult = QuizResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_attempt_entity_1.QuizAttempt, (a) => a.results, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'attemptId' }),
    __metadata("design:type", quiz_attempt_entity_1.QuizAttempt)
], QuizResult.prototype, "attempt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizResult.prototype, "attemptId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], QuizResult.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizResult.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'quizId' }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizResult.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizResult.prototype, "quizId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuizResult.prototype, "totalQuestions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuizResult.prototype, "attemptedQuestions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuizResult.prototype, "correctAnswers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuizResult.prototype, "wrongAnswers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], QuizResult.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], QuizResult.prototype, "percentage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuizResult.prototype, "createdAt", void 0);
exports.QuizResult = QuizResult = __decorate([
    (0, typeorm_1.Entity)('quiz_results')
], QuizResult);
//# sourceMappingURL=quiz-result.entity.js.map