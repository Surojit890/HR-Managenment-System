import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

export interface LeaveQuery {
  userId?: string;
  status?: string;
}

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LeaveQuery) {
    const where: Record<string, unknown> = {};

    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    return this.prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateLeaveDto) {
    return this.prisma.leaveRequest.create({
      data: {
        userId,
        type: dto.type as any,
        from: new Date(dto.from),
        to: new Date(dto.to),
        remarks: dto.remarks,
        attachment: dto.attachment,
      },
    });
  }

  async update(id: string, dto: UpdateLeaveDto) {
    const existing = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status as any,
        comments: dto.comments,
      },
    });
  }
}
