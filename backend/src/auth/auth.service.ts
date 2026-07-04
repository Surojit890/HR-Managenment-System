import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, req?: Request) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const employeeId = dto.employeeId?.trim() || await this.usersService.generateEmployeeId();

    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupExpires = new Date();
    setupExpires.setHours(setupExpires.getHours() + 24);

    const user = await this.usersService.create({
      employeeId,
      email: dto.email,
      password: null,
      role: dto.role,
      isVerified: false,
      passwordSetupToken: setupToken,
      passwordSetupExpires: setupExpires,
    });

    await this.prisma.employeeProfile.create({
      data: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        designation: dto.designation,
      },
    });

    try {
      await this.mailService.sendPasswordSetupEmail(dto.email, {
        employeeId,
        firstName: dto.firstName,
        designation: dto.designation,
        setupToken,
      });
    } catch (err) {
      this.logger.error(`Failed to send password setup email to ${dto.email}`, err);
    }

    await this.auditService.log('USER_CREATED', {
      userId: user.id,
      request: req,
      metadata: { employeeId, email: dto.email, role: dto.role },
    });

    const { password, ...safe } = user;
    return {
      ...safe,
      message: 'Account created. A password setup link has been emailed to the employee.',
    };
  }

  async login(dto: LoginDto, req?: Request, res?: Response) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      await this.auditService.log('LOGIN_FAILED', {
        request: req,
        metadata: { email: dto.email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Your password has not been set yet. Check your email for the password setup link.',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.auditService.log('LOGIN_FAILED', {
        userId: user.id,
        request: req,
        metadata: { reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Your email is not verified yet. Please check your inbox for the verification link.',
      );
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    if (res) {
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    await this.auditService.log('LOGIN_SUCCESS', {
      userId: user.id,
      request: req,
    });

    const { password, verifyToken, verifyTokenExpires, passwordSetupToken, passwordSetupExpires, ...safeUser } = user;
    return { access_token: accessToken, user: safeUser };
  }

  async refreshToken(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      });

      await this.auditService.log('TOKEN_REFRESHED', {
        userId: user.id,
        request: req,
      });

      return { access_token: accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return { message: 'Logged out successfully' };
  }

  async setupPassword(dto: SetupPasswordDto, req?: Request) {
    const user = await this.usersService.findByPasswordSetupToken(dto.token);
    if (!user) {
      throw new NotFoundException('Invalid or expired setup token');
    }

    if (user.passwordSetupExpires && new Date() > user.passwordSetupExpires) {
      throw new BadRequestException('Setup token has expired. Please request a new one.');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    await this.usersService.setPassword(user.id, hashed);

    await this.auditService.log('PASSWORD_SETUP', {
      userId: user.id,
      request: req,
    });

    return { message: 'Password set successfully. You can now log in.' };
  }

  async forgotPassword(email: string, req?: Request) {
    const user = await this.usersService.findByEmail(email);

    if (user && user.password) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      await this.usersService.setPasswordSetupToken(user.id, resetToken, expires);

      try {
        await this.mailService.sendPasswordResetEmail(email, resetToken);
      } catch (err) {
        this.logger.error(`Failed to send password reset email to ${email}`, err);
      }

      await this.auditService.log('PASSWORD_RESET_REQUESTED', {
        userId: user.id,
        request: req,
      });
    }

    return {
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.usersService.findByVerifyToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    if (user.verifyTokenExpires && new Date() > user.verifyTokenExpires) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    await this.usersService.markVerified(user.id);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }
    if (user.isVerified) {
      throw new BadRequestException('This email is already verified');
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.usersService.setVerifyToken(user.id, verifyToken, expires);

    try {
      await this.mailService.sendVerificationEmail(email, verifyToken);
    } catch (err) {
      this.logger.error(`Failed to resend verification email to ${email}`, err);
    }

    return { message: 'A new verification email has been sent.' };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }
}
