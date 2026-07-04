import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePayrollDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @ApiProperty({ example: 1500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowances?: number;

  @ApiProperty({ example: 600, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pf?: number;

  @ApiProperty({ example: 400, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherDeductions?: number;

  @ApiProperty({ example: '2026-07' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month: string;
}
