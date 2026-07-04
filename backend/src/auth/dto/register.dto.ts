import { IsEmail, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export class RegisterDto {
  @ApiProperty({ example: 'EMP-001', required: false, description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: 'alice@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, example: Role.EMPLOYEE })
  @IsEnum(Role, { message: 'Role must be ADMIN or EMPLOYEE' })
  role: Role;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'Williams' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ example: 'Senior Developer' })
  @IsString()
  @IsNotEmpty({ message: 'Designation is required' })
  designation: string;
}
