import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @ApiOperation({ summary: 'Get all payroll records (admin)' })
  @Get()
  findAll(@Query('month') month?: string) {
    return this.payrollService.findAll(month);
  }

  @ApiOperation({ summary: 'Get current user payroll' })
  @Get('me')
  findMine(
    @CurrentUser() user: { id: string },
    @Query('month') month?: string,
  ) {
    return this.payrollService.findMine(user.id, month);
  }

  @ApiOperation({ summary: 'Get payroll for a specific employee (admin)' })
  @Get(':employeeId')
  findByEmployee(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string,
  ) {
    return this.payrollService.findByEmployee(employeeId, month);
  }

  @ApiOperation({ summary: 'Update employee salary structure (admin)' })
  @Patch(':employeeId')
  update(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdatePayrollDto,
  ) {
    return this.payrollService.update(employeeId, dto);
  }
}
