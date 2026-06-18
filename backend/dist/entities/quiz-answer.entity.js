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
exports.QuizAnswer = void 0;
const typeorm_1 = require("typeorm");
const quiz_attempt_entity_1 = require("./quiz-attempt.entity");
const question_entity_1 = require("./question.entity");
const option_enum_1 = require("../common/enums/option.enum");
let QuizAnswer = class QuizAnswer {
};
exports.QuizAnswer = QuizAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_attempt_entity_1.QuizAttempt, (a) => a.answers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'attemptId' }),
    __metadata("design:type", quiz_attempt_entity_1.QuizAttempt)
], QuizAnswer.prototype, "attempt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizAnswer.prototype, "attemptId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'questionId' }),
    __metadata("design:type", question_entity_1.Question)
], QuizAnswer.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizAnswer.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: option_enum_1.CorrectOption }),
    __metadata("design:type", String)
], QuizAnswer.prototype, "selectedOption", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuizAnswer.prototype, "createdAt", void 0);
exports.QuizAnswer = QuizAnswer = __decorate([
    (0, typeorm_1.Entity)('quiz_answers')
], QuizAnswer);
//# sourceMappingURL=quiz-answer.entity.js.map