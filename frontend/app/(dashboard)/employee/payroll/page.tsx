"use client";

import { useState } from "react";
import { CreditCard, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import {
  Table, TableBody, TableCell, TableEmpty,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPayroll } from "@/lib/hooks/useEmployee";
import { formatCurrency } from "@/lib/format";

export default function EmployeePayrollPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const { data: payroll = [], isLoading } = useMyPayroll(month || undefined);

  const latest = payroll.find((p) => p.month === month) ?? payroll[payroll.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="month" className="text-sm">Month</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 w-40 text-sm"
          />
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : latest ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Basic Salary" value={formatCurrency(latest.basicSalary)} icon={DollarSign} subtitle="Base pay" accent="blue" />
            <StatCard title="Total Allowances" value={formatCurrency(latest.allowances)} icon={TrendingUp} subtitle="HRA + others" accent="emerald" />
            <StatCard title="Total Deductions" value={formatCurrency(latest.deductions)} icon={TrendingDown} subtitle="PF + tax + others" accent="amber" />
            <StatCard title="Net Salary" value={formatCurrency(latest.netSalary)} icon={CreditCard} subtitle="Take-home pay" accent="violet" />
          </div>

          {/* Component breakdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Earnings Breakdown">
              <ul className="divide-y text-sm">
                <BreakdownRow label="Basic Salary" value={latest.basicSalary} />
                <BreakdownRow label="HRA" value={latest.hra} />
                <BreakdownRow label="Other Allowances" value={latest.otherAllowances} />
                <BreakdownRow label="Total Earnings" value={latest.basicSalary + latest.allowances} bold />
              </ul>
            </SectionCard>
            <SectionCard title="Deductions Breakdown">
              <ul className="divide-y text-sm">
                <BreakdownRow label="Provident Fund (PF)" value={latest.pf} />
                <BreakdownRow label="Tax" value={latest.tax} />
                <BreakdownRow label="Other Deductions" value={latest.otherDeductions} />
                <BreakdownRow label="Total Deductions" value={latest.deductions} bold />
              </ul>
            </SectionCard>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
          No payroll record found for {month || "the selected month"}.
        </div>
      )}

      {/* History table */}
      <SectionCard title="Payroll History">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">HRA</TableHead>
                <TableHead className="text-right">PF</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right font-semibold">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.length === 0 && (
                <TableEmpty colSpan={6}>No payroll records yet.</TableEmpty>
              )}
              {[...payroll].reverse().map((p) => (
                <TableRow key={p.id} className={p.month === month ? "bg-blue-50/40" : ""}>
                  <TableCell className="font-medium">{p.month}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.basicSalary)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrency(p.hra)}</TableCell>
                  <TableCell className="text-right text-red-500">{formatCurrency(p.pf)}</TableCell>
                  <TableCell className="text-right text-red-500">{formatCurrency(p.tax)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(p.netSalary)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <li className={`flex items-center justify-between py-2 ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </li>
  );
}

