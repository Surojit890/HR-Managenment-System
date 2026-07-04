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
    password: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    isVerified?: boolean;
    verifyToken?: string;
    verifyTokenExpires?: Date;
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
}
