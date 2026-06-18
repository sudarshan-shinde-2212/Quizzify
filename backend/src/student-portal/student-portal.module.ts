import { Module } from '@nestjs/common';
import { StudentPortalController } from './student-portal.controller';
import { QuizzesModule } from '../quizzes/quizzes.module';

@Module({
  imports: [QuizzesModule],
  controllers: [StudentPortalController],
})
export class StudentPortalModule {}
