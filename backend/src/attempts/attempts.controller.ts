import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('student/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class AttemptsController {
  constructor(private attemptsService: AttemptsService) {}

  @Post(':quizId/start')
  start(@Param('quizId') quizId: string, @CurrentUser() user: any) {
    return this.attemptsService.startQuiz(user.id, quizId);
  }

  @Post(':quizId/submit')
  submit(
    @Param('quizId') quizId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.attemptsService.submitQuiz(user.id, quizId, dto);
  }
}
