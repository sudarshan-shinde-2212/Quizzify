import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { QuestionsModule } from './questions/questions.module';
import { AttemptsModule } from './attempts/attempts.module';
import { HealthController } from './health.controller';
import { ResultsModule } from './results/results.module';
import { StudentPortalModule } from './student-portal/student-portal.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { Admin } from './entities/admin.entity';
import { Student } from './entities/student.entity';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizResult } from './entities/quiz-result.entity';
import { Setting } from './entities/setting.entity';
import { SettingsModule } from './settings/settings.module';
import { AiQuizModule } from './ai-quiz/ai-quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
  type: 'postgres',
  host: config.get<string>('database.host'),
  port: config.get<number>('database.port'),
  username: config.get<string>('database.username'),
  password: config.get<string>('database.password'),
  database: config.get<string>('database.name'),
  entities: [Admin, Student, Quiz, Question, QuizAttempt, QuizAnswer, QuizResult, Setting],
  synchronize: true,
  logging: false,

  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
})
    }),
    AuthModule,
    StudentsModule,
    QuizzesModule,
    QuestionsModule,
    AttemptsModule,
    ResultsModule,
    StudentPortalModule,
    AiChatModule,
    SettingsModule,
    AiQuizModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
