import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Seed Admin
  const authService = app.get(AuthService);
  await authService.seedAdmin(
    'sudarshanshinde1012@gmail.com',
    'sudarshan123',
  );

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  console.log(`Quiz backend running on port${port}`);
  console.log('CORS enabled for explicitly allowed origins.');
}

bootstrap();