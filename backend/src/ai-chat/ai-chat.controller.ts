import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ChatDto } from './dto/chat.dto';
import { GenerateAiQuizDto } from '../ai-quiz/dto/generate-ai-quiz.dto';

@Controller()
export class AiChatController {
  constructor(private aiChatService: AiChatService) {}

  @Post('admin/ai-chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async chat(@Body() dto: ChatDto) {
    const response = await this.aiChatService.sendMessage(dto.messages);
    return { response };
  }

  @Post('admin/ai/generate-quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async generateQuiz(@Body() dto: GenerateAiQuizDto) {
    const quiz = await this.aiChatService.generateQuiz(dto.topic, dto.category, dto.difficulty, dto.questionCount);
    return quiz;
  }
}
