import { Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Post('test-email')
  async sendTestEmail() {
    const to = this.configService.get<string>('admin.email');
    if (!to) {
      this.logger.warn('ADMIN_EMAIL not configured, cannot send test email');
      return { success: false, message: 'ADMIN_EMAIL not set' };
    }
    try {
      const result = await this.emailService.sendQuizResult(
        to,
        'Admin Test',
        'Test Email',
        0,
        0,
        0, // totalQuestions placeholder
        0, // correctAnswers placeholder
        0, // wrongAnswers placeholder
        new Date(), // submissionDate placeholder
      );
      if (result.success) {
        this.logger.log(`Test email sent to ${to}`);
        return { success: true, message: `Test email sent to ${to}`, messageId: result.messageId };
      } else {
        this.logger.error(`Failed to send test email to ${to}: ${result.reason}`);
        return { success: false, message: result.reason };
      }
    } catch (error) {
      this.logger.error('Failed to send test email', (error as Error).stack);
      return { success: false, message: (error as Error).message };
    }
  }
}
