import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaveService, LeaveQuery } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation({ summary: 'Get leave requests (admins see all, employees see own)' })
  @Get()
  findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query() query: LeaveQuery,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'HR') {
      return this.leaveService.findAll({ ...query, userId: user.id });
    }
    return this.leaveService.findAll(query);
  }

  @ApiOperation({ summary: 'Create a leave request' })
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateLeaveDto,
  ) {
    return this.leaveService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leaveService.update(id, dto);
  }
}
