import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ────────────────────────────────────────────────────────────────
  // Allow explicit origins only: localhost:3000, localhost:5173, and Vercel.
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

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Seed default admin ───────────────────────────────────────────────────
  // Remove or move this to a dedicated seeder script in production.
  const authService = app.get(AuthService);
  await authService.seedAdmin(
    process.env.ADMIN_EMAIL    || 'admin@quizapp.com',
    process.env.ADMIN_PASSWORD || 'Admin@123',
  );

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);
  console.log(`Quiz backend running on http://localhost:${port}`);
  console.log(`CORS enabled for explicitly allowed origins.`);
}
bootstrap();
