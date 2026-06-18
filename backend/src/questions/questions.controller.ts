import {
  Controller, Post, Get, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BulkCreateQuestionDto } from './dto/bulk-create-question.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post('admin/quizzes/:quizId/questions')
  create(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(quizId, dto);
  }

  @Post('admin/quizzes/:quizId/questions/bulk')
  bulkCreate(
    @Param('quizId') quizId: string,
    @Body() dto: BulkCreateQuestionDto,
  ) {
    return this.questionsService.bulkCreate(quizId, dto.questions);
  }

  @Get('admin/quizzes/:quizId/questions')
  findAll(@Param('quizId') quizId: string) {
    return this.questionsService.findByQuiz(quizId);
  }

  @Patch('admin/questions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete('admin/questions/:id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
