"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const configuration_1 = require("./config/configuration");
const auth_module_1 = require("./auth/auth.module");
const students_module_1 = require("./students/students.module");
const quizzes_module_1 = require("./quizzes/quizzes.module");
const questions_module_1 = require("./questions/questions.module");
const attempts_module_1 = require("./attempts/attempts.module");
const results_module_1 = require("./results/results.module");
const student_portal_module_1 = require("./student-portal/student-portal.module");
const admin_entity_1 = require("./entities/admin.entity");
const student_entity_1 = require("./entities/student.entity");
const quiz_entity_1 = require("./entities/quiz.entity");
const question_entity_1 = require("./entities/question.entity");
const quiz_attempt_entity_1 = require("./entities/quiz-attempt.entity");
const quiz_answer_entity_1 = require("./entities/quiz-answer.entity");
const quiz_result_entity_1 = require("./entities/quiz-result.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('database.host'),
                    port: config.get('database.port'),
                    username: config.get('database.username'),
                    password: config.get('database.password'),
                    database: config.get('database.name'),
                    entities: [admin_entity_1.Admin, student_entity_1.Student, quiz_entity_1.Quiz, question_entity_1.Question, quiz_attempt_entity_1.QuizAttempt, quiz_answer_entity_1.QuizAnswer, quiz_result_entity_1.QuizResult],
                    synchronize: true,
                    logging: false,
                }),
            }),
            auth_module_1.AuthModule,
            students_module_1.StudentsModule,
            quizzes_module_1.QuizzesModule,
            questions_module_1.QuestionsModule,
            attempts_module_1.AttemptsModule,
            results_module_1.ResultsModule,
            student_portal_module_1.StudentPortalModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map