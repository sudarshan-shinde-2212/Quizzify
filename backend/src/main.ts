import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://quizzify-hkak.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
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

  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is missing');
  }

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD environment variable is missing');
  }

  await authService.seedAdmin(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD,
  );

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  console.log(`Quiz backend running on http://localhost:${port}`);
  console.log('CORS enabled for explicitly allowed origins.');
}

bootstrap();