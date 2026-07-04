import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum LeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED',
  UNPAID = 'UNPAID',
}

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveType, example: 'CASUAL' })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ example: '2026-07-10' })
  @IsISO8601()
  from: string;

  @ApiProperty({ example: '2026-07-12' })
  @IsISO8601()
  to: string;

  @ApiProperty({ required: false, example: 'Family vacation' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ required: false, example: 'medical_certificate.pdf' })
  @IsString()
  @IsOptional()
  attachment?: string;
}
