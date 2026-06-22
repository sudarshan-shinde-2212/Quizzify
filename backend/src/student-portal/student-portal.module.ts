import { Module } from '@nestjs/common';
import { StudentPortalController } from './student-portal.controller';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [QuizzesModule, SettingsModule],
  controllers: [StudentPortalController],
})
export class StudentPortalModule {}
