
import { Controller, Post, Body } from '@nestjs/common';
import { AiImageService } from './ai-image.service';
import { GenerateImageDto } from './dto/generate-image.dto';

@Controller('admin/ai-image')
export class AiImageController {
  constructor(private readonly aiImageService: AiImageService) {}

  @Post('generate')
  async generateImage(@Body() dto: GenerateImageDto) {
    return this.aiImageService.generateImage(dto.prompt);
  }
}
