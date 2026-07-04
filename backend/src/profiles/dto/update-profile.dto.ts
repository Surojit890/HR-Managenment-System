import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false, example: '+1 555-0100' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false, example: 'Senior Developer' })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ required: false, example: 'https://res.cloudinary.com/...' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ required: false, example: '1995-08-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ required: false, example: 'American' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ required: false, example: 'Male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ required: false, example: 'Single' })
  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @ApiProperty({ required: false, example: 'john.personal@gmail.com' })
  @IsString()
  @IsOptional()
  personalEmail?: string;

  @ApiProperty({ required: false, example: '123 Main St, Springfield, IL' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false, example: '1234567890' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ required: false, example: 'Chase Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ required: false, example: 'CHASUS33' })
  @IsString()
  @IsOptional()
  ifscCode?: string;

  @ApiProperty({ required: false, example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiProperty({ required: false, example: '101234567890' })
  @IsString()
  @IsOptional()
  uanNumber?: string;
}
