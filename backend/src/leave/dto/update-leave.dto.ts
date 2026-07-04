import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateLeaveDto {
  @ApiProperty({ enum: LeaveStatus, example: 'APPROVED' })
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiProperty({ required: false, example: 'Approved by HR' })
  @IsString()
  @IsOptional()
  comments?: string;
}
