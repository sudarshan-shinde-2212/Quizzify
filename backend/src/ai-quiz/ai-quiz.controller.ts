import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiQuizService } from './ai-quiz.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';
import { SaveAiQuizDto } from './dto/save-ai-quiz.dto';

@Controller('admin/ai-quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AiQuizController {
  constructor(private readonly aiQuizService: AiQuizService) {}

  @Post('generate')
  generateQuiz(@Body() dto: GenerateAiQuizDto) {
    return this.aiQuizService.generateQuiz(dto.topic, dto.category, dto.difficulty, dto.questionCount);
  }

  @Post('save')
  saveQuiz(@Req() req: any, @Body() dto: SaveAiQuizDto) {
    return this.aiQuizService.saveAiQuiz(req.user.id, dto);
  }
}
