"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const auth_service_1 = require("./auth/auth.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const authService = app.get(auth_service_1.AuthService);
    await authService.seedAdmin(process.env.ADMIN_EMAIL || 'admin@quizapp.com', process.env.ADMIN_PASSWORD || 'Admin@123');
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);
    console.log(`Quiz backend running on http://localhost:${port}`);
    console.log(`CORS enabled for: ${frontendUrl}`);
}
bootstrap();
//# sourceMappingURL=main.js.map