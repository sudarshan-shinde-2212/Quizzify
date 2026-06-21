import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck(@Res() res: Response) {
    return res.json({
      status: 'ok',
      service: 'quizzify-backend',
      timestamp: new Date().toISOString(),
    });
  }
}
