
import { Module } from '@nestjs/common';
import { AiImageService } from './ai-image.service';
import { AiImageController } from './ai-image.controller';

@Module({
  controllers: [AiImageController],
  providers: [AiImageService],
})
export class AiImageModule {}
