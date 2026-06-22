import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, Query,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('admin/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: any) {
    return this.quizzesService.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.quizzesService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Get(':id/stats')
  getQuizStats(@Param('id') id: string) {
    return this.quizzesService.getQuizStats(id);
  }

  @Get(':id/results')
  getQuizResults(
    @Param('id') id: string,
    @Query('q') search?: string,
    @Query('sortBy') sortBy?: 'date' | 'score',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.quizzesService.getQuizResults(id, search, sortBy, sortOrder);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.quizzesService.remove(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Body() dto: PublishQuizDto) {
    return this.quizzesService.publish(id, dto);
  }
}
