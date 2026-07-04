import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerifyDto {
  @ApiProperty({ example: 'alice@company.com' })
  @IsEmail()
  email: string;
}
