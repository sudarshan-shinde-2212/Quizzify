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
exports.QuizAttempt = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const quiz_entity_1 = require("./quiz.entity");
const quiz_answer_entity_1 = require("./quiz-answer.entity");
const quiz_result_entity_1 = require("./quiz-result.entity");
let QuizAttempt = class QuizAttempt {
};
exports.QuizAttempt = QuizAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizAttempt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (s) => s.attempts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], QuizAttempt.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizAttempt.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, (q) => q.attempts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'quizId' }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizAttempt.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizAttempt.prototype, "quizId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], QuizAttempt.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], QuizAttempt.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], QuizAttempt.prototype, "isSubmitted", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quiz_answer_entity_1.QuizAnswer, (a) => a.attempt, { cascade: true }),
    __metadata("design:type", Array)
], QuizAttempt.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quiz_result_entity_1.QuizResult, (r) => r.attempt),
    __metadata("design:type", Array)
], QuizAttempt.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuizAttempt.prototype, "createdAt", void 0);
exports.QuizAttempt = QuizAttempt = __decorate([
    (0, typeorm_1.Entity)('quiz_attempts'),
    (0, typeorm_1.Unique)(['studentId', 'quizId'])
], QuizAttempt);
//# sourceMappingURL=quiz-attempt.entity.js.map