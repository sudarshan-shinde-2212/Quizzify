import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ────────────────────────────────────────────────────────────────
  // Allow the Vite dev server (port 5173) and any FRONTEND_URL in production.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3001'],
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

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);
  console.log(`Quiz backend running on http://localhost:${port}`);
  console.log(`CORS enabled for: ${frontendUrl}`);
}
bootstrap();
