import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const appName = this.config.get<string>('APP_NAME', 'HRMS');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl}/verify?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b;">Welcome to ${appName}!</h2>
        <p style="color: #475569; font-size: 15px;">
          Your account has been created. Please verify your email address to activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background: #2563eb; color: #ffffff; padding: 12px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 15px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          Or copy this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">
          This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">${appName} — Human Resource Management System</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@hrms.com'),
      to,
      subject: `Verify your email — ${appName}`,
      html,
    });

    this.logger.log(`Verification email sent to ${to} (id: ${info.messageId})`);
    return info;
  }
}
