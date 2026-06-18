"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const attempts_service_1 = require("./attempts.service");
const attempts_controller_1 = require("./attempts.controller");
const quiz_attempt_entity_1 = require("../entities/quiz-attempt.entity");
const quiz_answer_entity_1 = require("../entities/quiz-answer.entity");
const quiz_result_entity_1 = require("../entities/quiz-result.entity");
const question_entity_1 = require("../entities/question.entity");
const quizzes_module_1 = require("../quizzes/quizzes.module");
let AttemptsModule = class AttemptsModule {
};
exports.AttemptsModule = AttemptsModule;
exports.AttemptsModule = AttemptsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([quiz_attempt_entity_1.QuizAttempt, quiz_answer_entity_1.QuizAnswer, quiz_result_entity_1.QuizResult, question_entity_1.Question]),
            quizzes_module_1.QuizzesModule,
        ],
        providers: [attempts_service_1.AttemptsService],
        controllers: [attempts_controller_1.AttemptsController],
    })
], AttemptsModule);
//# sourceMappingURL=attempts.module.js.map