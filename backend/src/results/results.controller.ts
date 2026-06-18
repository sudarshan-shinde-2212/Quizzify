import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private resultsService: ResultsService) {}

  // Student routes
  @Get('student/results')
  @Roles(Role.STUDENT)
  getMyResults(@CurrentUser() user: any) {
    return this.resultsService.getStudentResults(user.id);
  }

  @Get('student/results/:quizId')
  @Roles(Role.STUDENT)
  getMyResultByQuiz(
    @CurrentUser() user: any,
    @Param('quizId') quizId: string,
  ) {
    return this.resultsService.getStudentResultByQuiz(user.id, quizId);
  }

  // Admin routes
  @Get('admin/results')
  @Roles(Role.ADMIN)
  getAllResults() {
    return this.resultsService.getAllResults();
  }

  @Get('admin/results/:quizId')
  @Roles(Role.ADMIN)
  getResultsByQuiz(@Param('quizId') quizId: string) {
    return this.resultsService.getResultsByQuiz(quizId);
  }

  @Get('admin/results/student/:studentId')
  @Roles(Role.ADMIN)
  getResultsByStudent(@Param('studentId') studentId: string) {
    return this.resultsService.getResultsByStudent(studentId);
  }
}
