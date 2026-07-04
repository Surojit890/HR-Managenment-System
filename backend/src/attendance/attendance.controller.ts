import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService, AttendanceQuery } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Get attendance records' })
  @Get()
  findAll(@Query() query: AttendanceQuery) {
    return this.attendanceService.findAll(query);
  }

  @ApiOperation({ summary: 'Check in for the day' })
  @Post('check-in')
  checkIn(@CurrentUser() user: { id: string }) {
    return this.attendanceService.checkIn(user.id);
  }

  @ApiOperation({ summary: 'Check out for the day' })
  @Post('check-out')
  checkOut(@CurrentUser() user: { id: string }) {
    return this.attendanceService.checkOut(user.id);
  }
}
