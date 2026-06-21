import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    // Log presence of SMTP variables
    this.logger.log(`SMTP_HOST loaded: ${!!this.configService.get<string>('SMTP_HOST')}`);
    this.logger.log(`SMTP_PORT loaded: ${!!this.configService.get<string>('SMTP_PORT')}`);
    this.logger.log(`SMTP_USER loaded: ${!!this.configService.get<string>('SMTP_USER')}`);
    this.logger.log(`SMTP_PASS loaded: ${!!this.configService.get<string>('SMTP_PASS')}`);
    this.logger.log(`SMTP_FROM_EMAIL loaded: ${!!this.configService.get<string>('SMTP_FROM_EMAIL')}`);

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.configService.get<string>('SMTP_PORT')) || 587,
      secure: Number(this.configService.get<string>('SMTP_PORT')) === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    // Validate connection on startup but do not crash if it fails
    // Verify transporter on startup
    if (this.configService.get<string>('SMTP_USER') && this.configService.get<string>('SMTP_PASS')) {
      this.transporter.verify()
        .then(() => this.logger.log('SMTP verification successful'))
        .catch((error) => this.logger.warn(`SMTP verification failed: ${error.message}`));
    }
  }

  async sendQuizResult(
    to: string,
    studentName: string,
    quizTitle: string,
    score: number,
    percentage: number,
  ) {
    if (!this.configService.get<string>('SMTP_USER') || !this.configService.get<string>('SMTP_PASS')) {
      this.logger.warn('SMTP credentials not configured, skipping email.');
      return;
    }

    const passFailStatus = percentage >= 50 ? 'Passed' : 'Failed';
    const statusColor = percentage >= 50 ? '#10B981' : '#EF4444'; // Green or Red
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h2 style="color: #111827; text-align: center; margin-bottom: 5px;">Quizzify</h2>
        <h3 style="color: #374151; text-align: center; margin-top: 0;">Your Quiz Results</h3>
        
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>You have successfully submitted your attempt for the quiz: <strong>${quizTitle}</strong> on ${dateStr}.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #f3f4f6;">
          <p style="margin: 8px 0; font-size: 16px;"><strong>Score:</strong> ${score}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Percentage:</strong> ${percentage}%</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${passFailStatus}</span></p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
          If you have any questions about your results, please contact your administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Quizzify. All rights reserved.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Quizzify" <${this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER')}>`,
        to,
        subject: `Your Quiz Results: ${quizTitle}`,
        html,
      });
      this.logger.log(`Sent result email to ${to} for quiz ${quizTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
