import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const user = await this.usersService.create({
      employeeId: dto.employeeId,
      email: dto.email,
      password: hashed,
      role: dto.role,
      isVerified: false,
      verifyToken,
      verifyTokenExpires: expires,
    });

    try {
      await this.mailService.sendVerificationEmail(dto.email, verifyToken);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${dto.email}`, err);
    }

    const { password, ...safe } = user;
    return { ...safe, message: 'Account created. A verification email has been sent.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
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

    const { password, verifyToken, verifyTokenExpires, ...safeUser } = user;
    return { access_token: accessToken, user: safeUser };
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
