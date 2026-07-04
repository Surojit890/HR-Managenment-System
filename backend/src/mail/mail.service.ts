import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');
    const smtpHost = this.config.get<string>('SMTP_HOST', 'localhost');
    const smtpPort = parseInt(String(this.config.get('SMTP_PORT', '1025')), 10);

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        ignoreTLS: true,
      });
    }
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

  async sendPasswordSetupEmail(
    to: string,
    details: {
      employeeId: string;
      firstName: string;
      designation: string;
      setupToken: string;
    },
  ) {
    const appName = this.config.get<string>('APP_NAME', 'HRMS');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const setupUrl = `${frontendUrl}/setup-password?token=${details.setupToken}`;
    const loginUrl = `${frontendUrl}/login`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b;">Welcome to ${appName}, ${details.firstName}!</h2>
        <p style="color: #475569; font-size: 15px;">
          Your HRMS account has been created by your administrator. Please set your password to activate your account.
        </p>

        <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Employee ID</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${details.employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email (Username)</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Designation</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${details.designation}</td>
          </tr>
        </table>

        <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px; color: #1e293b; font-size: 14px; font-weight: 600;">
            Set your password
          </p>
          <p style="margin: 0 0 12px; color: #475569; font-size: 13px;">
            Click the button below to choose your password and activate your account. This also verifies your email address.
          </p>
          <a href="${setupUrl}"
             style="background: #2563eb; color: #ffffff; padding: 10px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 14px;">
            Set My Password
          </a>
          <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px;">
            Or paste this link: <a href="${setupUrl}" style="color: #2563eb;">${setupUrl}</a>
          </p>
        </div>

        <div style="background: #f1f5f9; border-left: 4px solid #16a34a; padding: 14px 18px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px; color: #1e293b; font-size: 14px; font-weight: 600;">
            After setting your password
          </p>
          <p style="margin: 0; color: #475569; font-size: 13px;">
            Go to <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
            and sign in with your email and the password you chose.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px;">
          This link will expire in 24 hours. If you did not expect this email, please contact your HR administrator.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">${appName} — Human Resource Management System</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@hrms.com'),
      to,
      subject: `Set your password — ${appName} account`,
      html,
    });

    this.logger.log(`Password setup email sent to ${to} (id: ${info.messageId})`);
    return info;
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const appName = this.config.get<string>('APP_NAME', 'HRMS');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const loginUrl = `${frontendUrl}/login`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">
          We received a request to reset your ${appName} password. Click the button below to choose a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #2563eb; color: #ffffff; padding: 12px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">
          This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">${appName} — Human Resource Management System</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@hrms.com'),
      to,
      subject: `Reset your password — ${appName}`,
      html,
    });

    this.logger.log(`Password reset email sent to ${to} (id: ${info.messageId})`);
    return info;
  }
}
