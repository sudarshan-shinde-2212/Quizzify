import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    // Load ALL SMTP config values and log them (NO PASSWORDS!)
    const emailEnabled = this.configService.get<boolean>('email.enabled');
    const smtpHost = this.configService.get<string>('smtp.host');
    const smtpPort = this.configService.get<number>('smtp.port');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');
    const smtpFromEmail = this.configService.get<string>('smtp.fromEmail');

    this.logger.log('=== EMAIL SERVICE CONFIGURATION ===');
    this.logger.log(`EMAIL_ENABLED: ${emailEnabled}`);
    this.logger.log(`smtp.host: ${smtpHost}`);
    this.logger.log(`smtp.port: ${smtpPort}`);
    this.logger.log(`smtp.user: ${smtpUser}`);
    this.logger.log(`smtp.fromEmail: ${smtpFromEmail}`);
    this.logger.log('====================================');

    if (emailEnabled && smtpHost && smtpPort && smtpUser && smtpPass) {
      this.logger.log('Initializing MINIMAL Brevo-compatible SMTP transporter...');
      // Simplest possible Brevo-compatible configuration!
      const transporterOptions = {
        host: smtpHost,
        port: smtpPort,
        secure: false, // Port 587 uses STARTTLS, not direct TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };
      
      this.logger.log(`Transporter options: ${JSON.stringify({
        ...transporterOptions,
        auth: { user: transporterOptions.auth.user, pass: '***REDACTED***' }
      })}`);

      this.transporter = nodemailer.createTransport(transporterOptions);

      // Verify transporter asynchronously (don't block startup)
      this.logger.log('Starting transporter verification...');
      this.transporter.verify()
        .then(() => {
          this.logger.log('✅ SMTP transporter verified and ready!');
        })
        .catch((error) => {
          this.logger.warn('⚠️ SMTP transporter verification failed:');
          this.logger.warn(error.message);
          this.logger.warn(error.stack);
          this.logger.warn('Will still attempt to send emails...');
        });
    } else if (!emailEnabled) {
      this.logger.warn('⚠️ Email service disabled via EMAIL_ENABLED flag.');
    } else {
      this.logger.warn('⚠️ Missing SMTP credentials! Check environment variables.');
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
    const emailEnabled = this.configService.get<boolean>('email.enabled');
    if (!emailEnabled) {
      this.logger.log('Email disabled. Skipping send.');
      return { success: false, reason: 'Email disabled' };
    }
    
    if (!this.transporter) {
      this.logger.warn('Transporter not initialized. Skipping send.');
      return { success: false, reason: 'Transporter not initialized' };
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
      this.logger.log(`Calling sendMail() from ${fromEmail} to ${to}...`);

      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject: `Your Quiz Results: ${quizTitle}`,
        html,
      });

      this.logger.log('✅ sendMail() SUCCESS!');
      this.logger.log(`MessageId: ${info.messageId}`);
      this.logger.log(`SMTP Response: ${info.response}`);

      return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
      const err = error as Error;
      this.logger.error('❌ sendMail() FAILED!');
      this.logger.error(`Error Message: ${err.message}`);
      this.logger.error('Full Stack Trace:', err.stack);
      return { success: false, reason: err.message };
    }
  }
}
