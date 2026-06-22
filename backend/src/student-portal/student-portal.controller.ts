import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QuizzesService } from '../quizzes/quizzes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MaintenanceModeGuard } from '../common/guards/maintenance-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Question } from '../entities/question.entity';

type PublicQuestion = Omit<Question, 'correctOption'>;

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard, MaintenanceModeGuard)
@Roles(Role.STUDENT)
export class StudentPortalController {
  constructor(private quizzesService: QuizzesService) {}

  @Get('quizzes')
  getActiveQuizzes() {
    return this.quizzesService.findActiveQuizzes();
  }

  @Get('quizzes/:id')
  async getActiveQuiz(@Param('id') id: string) {
    const quiz = await this.quizzesService.findOneActive(id);
    const questions: PublicQuestion[] = quiz.questions?.map((question) => {
      const { correctOption, ...publicQuestion } = question;
      return publicQuestion;
    }) ?? [];

    return { ...quiz, questions };
  }
}
