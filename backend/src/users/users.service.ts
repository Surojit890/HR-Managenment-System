import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByVerifyToken(token: string) {
    return this.prisma.user.findFirst({
      where: { verifyToken: token },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  async create(data: {
    employeeId: string;
    email: string;
    password: string | null;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    isVerified?: boolean;
    verifyToken?: string;
    verifyTokenExpires?: Date;
    passwordSetupToken?: string;
    passwordSetupExpires?: Date;
  }) {
    return this.prisma.user.create({ data });
  }

  async markVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });
  }

  async setVerifyToken(id: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id },
      data: {
        verifyToken: token,
        verifyTokenExpires: expires,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  async generateEmployeeId(): Promise<string> {
    const users = await this.prisma.user.findMany({
      select: { employeeId: true },
    });

    let max = 0;
    for (const u of users) {
      const match = u.employeeId.match(/^EMP-(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > max) max = n;
      }
    }

    return `EMP-${String(max + 1).padStart(3, '0')}`;
  }

  async findByPasswordSetupToken(token: string) {
    return this.prisma.user.findFirst({
      where: { passwordSetupToken: token },
    });
  }

  async setPassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordSetupToken: null,
        passwordSetupExpires: null,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });
  }

  async setPasswordSetupToken(id: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordSetupToken: token,
        passwordSetupExpires: expires,
      },
    });
  }
}
