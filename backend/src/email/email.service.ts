import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('smtp.host');
    const smtpPort = this.configService.get<number>('smtp.port');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');

    // Log presence of SMTP variables (without exposing sensitive data)
    this.logger.log(`SMTP_HOST configured: ${!!smtpHost}`);
    this.logger.log(`SMTP_PORT configured: ${!!smtpPort}`);
    this.logger.log(`SMTP_USER configured: ${!!smtpUser}`);
    this.logger.log(`SMTP_PASS configured: ${!!smtpPass}`);
    this.logger.log(`SMTP_FROM_EMAIL configured: ${!!this.configService.get<string>('smtp.fromEmail')}`);

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.logger.log('Initializing SMTP transporter...');
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Timeouts for production environments
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // TLS configuration
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
        },
      });

      // Verify transporter asynchronously (don't block startup)
      this.transporter.verify()
        .then(() => {
          this.logger.log('✅ SMTP transporter verified and ready');
        })
        .catch((error) => {
          this.logger.warn(`⚠️ SMTP transporter verification failed: ${error.message}`);
          this.logger.warn('Emails may still work if verification is flaky; will attempt to send anyway.');
        });
    } else {
      this.logger.warn('⚠️ SMTP credentials not fully configured; email service will be disabled');
    }
  }

  async sendQuizResult(
    to: string,
    studentName: string,
    quizTitle: string,
    score: number,
    percentage: number,
    totalQuestions: number,
    correctAnswers: number,
    wrongAnswers: number,
    submissionDate: Date,
  ) {
    if (!this.transporter) {
      this.logger.warn('Email service not configured; skipping email');
      return { success: false, reason: 'Email service not configured' };
    }

    this.logger.log(`sendQuizResult called for: ${to} (${studentName})`);

    const passFailStatus = percentage >= 50 ? 'Passed' : 'Failed';
    const statusColor = percentage >= 50 ? '#10B981' : '#EF4444';
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
          <p style="margin: 8px 0; font-size: 16px;"><strong>Total Questions:</strong> ${totalQuestions}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Correct Answers:</strong> ${correctAnswers}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Wrong Answers:</strong> ${wrongAnswers}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Submission Date:</strong> ${submissionDate.toLocaleString()}</p>
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
      const fromEmail = `"Quizzify" <${this.configService.get<string>('smtp.fromEmail') || this.configService.get<string>('smtp.user')}>`;
      this.logger.log(`Attempting to send email from ${fromEmail} to ${to}`);
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject: `Your Quiz Results: ${quizTitle}`,
        html,
      });
      this.logger.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${(error as Error).message}`);
      return { success: false, reason: (error as Error).message };
    }
  }
}
