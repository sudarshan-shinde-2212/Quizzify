import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'body-parser';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';

import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });

  // Serve uploads folder statically
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Add custom body parser with larger limits
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // CORS – dev origins are always included; production frontend is set via FRONTEND_URL env var
  const frontendUrl = process.env.FRONTEND_URL;
  const corsOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
    corsOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Initialize First Admin
  const authService = app.get(AuthService);
  const configService = app.get(ConfigService);
  const firstAdminEmail = configService.get<string>('firstAdmin.email');
  const firstAdminPassword = configService.get<string>('firstAdmin.password');
  await authService.initializeFirstAdmin(firstAdminEmail, firstAdminPassword);

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  console.log(`Quiz backend running on port${port}`);
  console.log('CORS enabled for explicitly allowed origins.');
}

bootstrap();