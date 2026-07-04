import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) throw new NotFoundException('User not found');

    return { user, profile: user.profile };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      const data: Record<string, unknown> = { ...dto };
      if (dto.dateOfBirth !== undefined) {
        data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
      }
      const profile = await this.prisma.employeeProfile.update({
        where: { userId },
        data: data as any,
      });
      return { profile };
    }

    const profile = await this.prisma.employeeProfile.create({
      data: {
        userId,
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        phone: dto.phone,
        department: dto.department,
        designation: dto.designation,
        avatarUrl: dto.avatarUrl,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationality: dto.nationality,
        gender: dto.gender,
        maritalStatus: dto.maritalStatus,
        personalEmail: dto.personalEmail,
        address: dto.address,
        accountNumber: dto.accountNumber,
        bankName: dto.bankName,
        ifscCode: dto.ifscCode,
        panNumber: dto.panNumber,
        uanNumber: dto.uanNumber,
      },
    });

    return { profile };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const existing = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      const profile = await this.prisma.employeeProfile.update({
        where: { userId },
        data: { avatarUrl },
      });
      return { profile };
    }

    const profile = await this.prisma.employeeProfile.create({
      data: { userId, firstName: '', lastName: '', avatarUrl },
    });
    return { profile };
  }
}
