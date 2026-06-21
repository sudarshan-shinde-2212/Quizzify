import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('smtp.host');
    const smtpPort = this.configService.get<number>('smtp.port');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');

    // Log presence of SMTP variables
    this.logger.log(`SMTP_HOST loaded: ${!!smtpHost}`);
    this.logger.log(`SMTP_PORT loaded: ${!!smtpPort}`);
    this.logger.log(`SMTP_USER loaded: ${!!smtpUser}`);
    this.logger.log(`SMTP_PASS loaded: ${!!smtpPass}`);
    this.logger.log(`SMTP_FROM_EMAIL loaded: ${!!this.configService.get<string>('smtp.fromEmail')}`);

    this.logger.log(`SMTP_HOST: ${smtpHost}`);
this.logger.log(`SMTP_PORT actual value: ${smtpPort}`);
this.logger.log(`SMTP_USER loaded: ${!!smtpUser}`);
this.logger.log(`SMTP_PASS loaded: ${!!smtpPass}`);

this.transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,

  auth: {
    user: smtpUser,
    pass: smtpPass,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,

  tls: {
    rejectUnauthorized: false,
  },
});

    // Verify transporter on startup if credentials are available
    if (smtpUser && smtpPass) {
      this.transporter.verify()
  .then(() => {
    this.logger.log('SMTP verification successful');
  })
  .catch((error) => {
    this.logger.error(`SMTP verification failed: ${error.message}`);
  });
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
    this.logger.log(`[DEBUG] sendQuizResult called. to: ${to}, studentName: ${studentName}, quizTitle: ${quizTitle}, score: ${score}`);
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');
    if (!smtpUser || !smtpPass) {
      this.logger.warn('[DEBUG] SMTP credentials not configured, skipping email.');
      return { success: false, reason: 'SMTP credentials missing' };
    }

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
      const fromEmail = `"Quizzify" <${this.configService.get<string>('smtp.fromEmail') || smtpUser}>`;
      this.logger.log(`[DEBUG] Attempting to sendMail. From: ${fromEmail}, To: ${to}, Subject: Your Quiz Results: ${quizTitle}`);
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject: `Your Quiz Results: ${quizTitle}`,
        html,
      });
      this.logger.log(`[DEBUG] sendMail succeeded. MessageId: ${info.messageId}, Response: ${info.response}`);
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
      this.logger.error(`[DEBUG] sendMail failed for ${to}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
