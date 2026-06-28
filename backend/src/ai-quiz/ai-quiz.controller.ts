import { Controller, Post, Body, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException, OnModuleInit } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AiQuizService } from './ai-quiz.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';
import { SaveAiQuizDto } from './dto/save-ai-quiz.dto';
import { GenerateQuizFromFileDto } from './dto/generate-quiz-from-file.dto';
import { QuizFileProcessorService } from './quiz-file-processor.service';
import { ConfigService } from '@nestjs/config';

const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const ACCEPTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
const ACCEPTED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AiQuizController implements OnModuleInit {
  private rateLimits = new Map<string, number[]>();

  constructor(
    private readonly aiQuizService: AiQuizService,
    private readonly quizFileProcessorService: QuizFileProcessorService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const dirs = ['./temp', './uploads'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private checkRateLimit(userId: string) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    let userRequests = this.rateLimits.get(userId) || [];
    userRequests = userRequests.filter(time => now - time < windowMs);
    
    if (userRequests.length >= maxRequests) {
      throw new BadRequestException('Rate limit exceeded. You can generate up to 5 quizzes per minute.');
    }

    userRequests.push(now);
    this.rateLimits.set(userId, userRequests);
  }

  @Post('ai-quiz/generate')
  generateQuiz(@Req() req: any, @Body() dto: GenerateAiQuizDto) {
    this.checkRateLimit(req.user.id);
    return this.aiQuizService.generateQuiz(dto.topic, dto.category, dto.difficulty, dto.questionCount);
  }

  @Post('ai-quiz/save')
  saveQuiz(@Req() req: any, @Body() dto: SaveAiQuizDto) {
    return this.aiQuizService.saveAiQuiz(req.user.id, dto);
  }

  @Post('ai-image/upload')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only PNG, JPG, JPEG, and WEBP images are allowed'), false);
      }
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const cloudflareToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    const cloudflareAccount = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');

    if (cloudflareToken && cloudflareAccount) {
      try {
        const formData = new FormData();
        const fileBlob = new Blob([fs.readFileSync(file.path)], { type: file.mimetype });
        formData.append('file', fileBlob, file.originalname);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccount}/images/v1`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cloudflareToken}`,
            },
            body: formData,
          }
        );

        const result: any = await response.json();

        // Clean up local temp file after uploading to Cloudflare
        try {
          await fs.promises.unlink(file.path);
        } catch {}

        if (response.ok && result.success && result.result?.variants?.[0]) {
          return { imageUrl: result.result.variants[0] };
        }
      } catch (err) {
        console.error('Error uploading to Cloudflare Images:', err);
      }
    }

    // Local fallback URL
    const backendUrl = this.configService.get<string>('BACKEND_URL') || '';
    return { imageUrl: `${backendUrl}/uploads/${file.filename}` };
  }

  @Post('generate-quiz-from-file')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './temp',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allAcceptedExtensions = [
        ...ACCEPTED_VIDEO_EXTENSIONS,
        ...ACCEPTED_AUDIO_EXTENSIONS,
        ...ACCEPTED_DOCUMENT_EXTENSIONS
      ];
      
      if (allAcceptedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Unsupported file type'), false);
      }
    },
  }))
  async generateQuizFromFile(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: GenerateQuizFromFileDto,
  ) {
    this.checkRateLimit(req.user.id);
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const ext = path.extname(file.originalname).toLowerCase();
    let validFileType = false;
    if (dto.fileType === 'video') {
      validFileType = ACCEPTED_VIDEO_EXTENSIONS.includes(ext);
    } else if (dto.fileType === 'audio') {
      validFileType = ACCEPTED_AUDIO_EXTENSIONS.includes(ext);
    } else if (dto.fileType === 'document') {
      validFileType = ACCEPTED_DOCUMENT_EXTENSIONS.includes(ext);
    }
    
    if (!validFileType) {
      try {
        await fs.promises.unlink(file.path);
      } catch {}
      throw new BadRequestException('File extension does not match declared file type');
    }

    let actualMaxFileSizeMB = 50; // default for unknown doc
    if (ext === '.docx') actualMaxFileSizeMB = 15;
    else if (ext === '.txt') actualMaxFileSizeMB = 5;
    else if (ext === '.pdf') actualMaxFileSizeMB = 15;
    else if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) actualMaxFileSizeMB = 250;
    else if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(ext)) actualMaxFileSizeMB = 100;
    
    const maxFileSizeBytes = actualMaxFileSizeMB * 1024 * 1024;
    
    if (file.size > maxFileSizeBytes) {
      try {
        await fs.promises.unlink(file.path);
      } catch {}
      throw new BadRequestException(`File too large. Maximum size for ${ext.toUpperCase().replace('.', '')} is ${actualMaxFileSizeMB}MB.`);
    }
    
    return this.quizFileProcessorService.generateQuizFromFile({
      filePath: file.path,
      fileType: dto.fileType,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount,
      questionType: dto.questionType,
      language: dto.language,
    });
  }
}
