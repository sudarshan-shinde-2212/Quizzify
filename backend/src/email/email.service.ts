import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly configService: ConfigService) {
    const emailEnabled = this.configService.get<boolean>('email.enabled');
    const smtpHost = this.configService.get<string>('smtp.host');
    const smtpPort = this.configService.get<number>('smtp.port');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');

    // Log presence of SMTP variables (without exposing sensitive data)
    this.logger.log(`EMAIL_ENABLED: ${emailEnabled}`);
    this.logger.log(`SMTP_HOST configured: ${!!smtpHost}`);
    this.logger.log(`SMTP_PORT configured: ${!!smtpPort} (value: ${smtpPort})`);
    this.logger.log(`SMTP_USER configured: ${!!smtpUser}`);
    this.logger.log(`SMTP_PASS configured: ${!!smtpPass}`);
    this.logger.log(`SMTP_FROM_EMAIL configured: ${!!this.configService.get<string>('smtp.fromEmail')}`);

    if (emailEnabled && smtpHost && smtpPort && smtpUser && smtpPass) {
      this.logger.log('Initializing SMTP transporter with options...');
      const options = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Timeouts for production environments (increased to 30s)
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        // Force IPv4 to avoid ENETUNREACH errors on Render
        family: 4,
        // TLS configuration
        tls: {
          rejectUnauthorized: false, // Disable for better compatibility on Render
        },
        pool: true, // Use connection pooling for better performance
        maxConnections: 5,
      } as SMTPTransport.Options & { family?: number; pool?: boolean; maxConnections?: number };
      
      this.logger.log(`Transporter options: host=${options.host}, port=${options.port}, secure=${options.secure}, pool=${(options as any).pool}`);
      
      this.transporter = nodemailer.createTransport(options);

      // Verify transporter asynchronously (don't block startup)
      this.logger.log('Starting transporter verification...');
      this.transporter.verify()
        .then(() => {
          this.logger.log('✅ SMTP transporter verified and ready');
        })
        .catch((error) => {
          this.logger.warn(`⚠️ SMTP transporter verification failed: ${error.message}`, error.stack);
          this.logger.warn('⚠️ This is common with Gmail on Render. Switch to Brevo (see .env.example) for free, reliable emails!');
          this.logger.warn('Will still attempt to send emails when needed...');
        });
    } else if (!emailEnabled) {
      this.logger.warn('⚠️ Email service disabled via EMAIL_ENABLED flag; skipping initialization');
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
    const emailEnabled = this.configService.get<boolean>('email.enabled');
    if (!emailEnabled) {
      this.logger.log('Email service disabled via EMAIL_ENABLED flag; skipping email');
      return { success: false, reason: 'Email service disabled' };
    }
    
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
      
      // Let Nodemailer handle timeouts with its built-in options
      this.logger.log('Calling transporter.sendMail()...');
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject: `Your Quiz Results: ${quizTitle}`,
        html,
      });
      
      this.logger.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
      this.logger.log(`SMTP Response: ${info.response}`);
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Failed to send email to ${to}: ${err.message}`, err.stack);
      if (this.isProduction && err.message.toLowerCase().includes('gmail')) {
        this.logger.warn('⚠️ Gmail is not recommended for production on Render! See .env.example for Brevo/SendGrid alternatives.');
      }
      return { success: false, reason: err.message };
    }
  }
}
