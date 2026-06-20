import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
export class AiChatController {
  constructor(private aiChatService: AiChatService) {}

  @Post('admin/ai-chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async chat(@Body() body: { messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> }) {
    const response = await this.aiChatService.sendMessage(body.messages);
    return { response };
  }
}
