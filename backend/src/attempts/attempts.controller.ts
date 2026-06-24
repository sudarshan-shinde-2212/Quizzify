import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { RecordViolationDto } from './dto/record-violation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MaintenanceModeGuard } from '../common/guards/maintenance-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('student/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard, MaintenanceModeGuard)
@Roles(Role.STUDENT)
export class AttemptsController {
  constructor(private attemptsService: AttemptsService) {}

  @Post(':quizId/start')
  start(@Param('quizId') quizId: string, @CurrentUser() user: any) {
    return this.attemptsService.startQuiz(user.id, quizId);
  }

  @Get(':quizId/attempt')
  getAttempt(@Param('quizId') quizId: string, @CurrentUser() user: any) {
    return this.attemptsService.getAttempt(user.id, quizId);
  }

  @Get(':quizId/attempt/review')
  getAttemptWithAnswers(@Param('quizId') quizId: string, @CurrentUser() user: any) {
    return this.attemptsService.getAttemptWithAnswers(user.id, quizId);
  }

  @Post(':quizId/violation')
  recordViolation(
    @Param('quizId') quizId: string,
    @CurrentUser() user: any,
    @Body() dto: RecordViolationDto,
  ) {
    return this.attemptsService.recordViolation(user.id, quizId, dto);
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
