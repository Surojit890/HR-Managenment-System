import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPayroll(p: any) {
    return {
      ...p,
      basicSalary: Number(p.basicSalary),
      hra: Number(p.hra),
      otherAllowances: Number(p.otherAllowances),
      allowances: Number(p.allowances),
      pf: Number(p.pf),
      tax: Number(p.tax),
      otherDeductions: Number(p.otherDeductions),
      deductions: Number(p.deductions),
      netSalary: Number(p.netSalary),
    };
  }

  /** Auto-derive aggregate allowances, deductions, and net from components */
  private compute(dto: UpdatePayrollDto) {
    const hra = dto.hra ?? 0;
    const otherAllowances = dto.otherAllowances ?? 0;
    const pf = dto.pf ?? 0;
    const tax = dto.tax ?? 0;
    const otherDeductions = dto.otherDeductions ?? 0;

    const allowances = hra + otherAllowances;
    const deductions = pf + tax + otherDeductions;
    const netSalary = dto.basicSalary + allowances - deductions;

    return { hra, otherAllowances, allowances, pf, tax, otherDeductions, deductions, netSalary };
  }

  async findAll(month?: string) {
    const where: Record<string, unknown> = {};
    if (month) where.month = month;
    const records = await this.prisma.payroll.findMany({ where });
    return records.map((p) => this.mapPayroll(p));
  }

  async findMine(userId: string, month?: string) {
    const where: Record<string, unknown> = { userId };
    if (month) where.month = month;
    const records = await this.prisma.payroll.findMany({ where });
    return records.map((p) => this.mapPayroll(p));
  }

  async findByEmployee(employeeId: string, month?: string) {
    const where: Record<string, unknown> = { userId: employeeId };
    if (month) where.month = month;
    const records = await this.prisma.payroll.findMany({ where });
    return records.map((p) => this.mapPayroll(p));
  }

  async update(employeeId: string, dto: UpdatePayrollDto) {
    const derived = this.compute(dto);
    const data = {
      basicSalary: dto.basicSalary,
      ...derived,
    };

    const record = await this.prisma.payroll.upsert({
      where: { userId_month: { userId: employeeId, month: dto.month } },
      update: data,
      create: { userId: employeeId, month: dto.month, ...data },
    });

    return this.mapPayroll(record);
  }
}
