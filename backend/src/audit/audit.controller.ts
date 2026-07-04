import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'List audit logs — admin only' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'HR') {
      throw new ForbiddenException('Only admins can view audit logs');
    }

    const pageNum = Math.max(1, parseInt(page ?? '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(pageSize ?? '50', 10)));

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          user: {
            select: { id: true, employeeId: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: pageNum, pageSize: size };
  }
}
