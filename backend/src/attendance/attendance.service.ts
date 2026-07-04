import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AttendanceQuery {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AttendanceQuery) {
    const where: Record<string, unknown> = {};

    if (query.userId) where.userId = query.userId;

    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) (where.date as any).gte = new Date(query.dateFrom);
      if (query.dateTo) (where.date as any).lte = new Date(query.dateTo);
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { checkIn: 'desc' },
    });
  }

  async checkIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    return this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: new Date(),
      },
    });
  }

  async checkOut(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.findFirst({
      where: { userId, date: today, checkOut: null },
    });

    if (!record) {
      throw new NotFoundException('No active check-in found for today');
    }

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: new Date() },
    });
  }
}
