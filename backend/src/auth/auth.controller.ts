import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendVerifyDto } from './dto/resend-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Create a new user – admin only' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @CurrentUser() admin: { role: string },
    @Req() req: Request,
  ) {
    if (admin.role !== 'ADMIN' && admin.role !== 'HR') {
      throw new ForbiddenException('Only admins can create new user accounts');
    }
    return this.authService.register(dto, req);
  }

  @ApiOperation({ summary: 'Login and receive a JWT + refresh cookie' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, req, res);
  }

  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(req, res);
  }

  @ApiOperation({ summary: 'Logout — clears refresh token cookie' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @ApiOperation({ summary: 'Set password via setup/reset token' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('setup-password')
  setupPassword(
    @Body() dto: SetupPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.setupPassword(dto, req);
  }

  @ApiOperation({ summary: 'Request a password reset link' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.forgotPassword(dto.email, req);
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Resend email verification link' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  resend(@Body() dto: ResendVerifyDto) {
    return this.authService.resendVerification(dto.email);
  }

  @ApiOperation({ summary: 'Get currently authenticated user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
