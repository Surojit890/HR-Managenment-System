"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEmployees, usePayrolls, useUpdatePayroll } from "@/lib/hooks/useAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { Payroll, UserWithProfile } from "@/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

interface PayrollRow {
  employee: UserWithProfile;
  payroll?: Payroll;
}

export default function AdminPayrollPage() {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const [month, setMonth] = useState(currentMonth());
  const { data: payrolls = [], isLoading: loadingPayrolls } = usePayrolls(month);
  const updatePayroll = useUpdatePayroll();

  const [dialog, setDialog] = useState<{
    employee: UserWithProfile;
    payroll?: Payroll;
  } | null>(null);

  const [form, setForm] = useState({
    basicSalary: 0,
    hra: 0,
    otherAllowances: 0,
    pf: 0,
    tax: 0,
    otherDeductions: 0,
  });

  useEffect(() => {
    if (dialog) {
      setForm({
        basicSalary: dialog.payroll?.basicSalary ?? 0,
        hra: dialog.payroll?.hra ?? 0,
        otherAllowances: dialog.payroll?.otherAllowances ?? 0,
        pf: dialog.payroll?.pf ?? 0,
        tax: dialog.payroll?.tax ?? 0,
        otherDeductions: dialog.payroll?.otherDeductions ?? 0,
      });
    }
  }, [dialog]);

  const rows: PayrollRow[] = useMemo(() => {
    const byUser = new Map(payrolls.map((p) => [p.userId, p]));
    return employees.map((employee) => ({
      employee,
      payroll: byUser.get(employee.id),
    }));
  }, [employees, payrolls]);

  const totalAllowances = form.hra + form.otherAllowances;
  const totalDeductions = form.pf + form.tax + form.otherDeductions;
  const netSalary = form.basicSalary + totalAllowances - totalDeductions;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }));

  const handleSave = () => {
    if (!dialog) return;
    updatePayroll.mutate(
      { employeeId: dialog.employee.id, data: { ...form, month } },
      { onSuccess: () => setDialog(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500">View and update employee salary structures.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Month
          </label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingEmployees || loadingPayrolls ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableEmpty colSpan={6}>No employees found.</TableEmpty>
            ) : (
              rows.map(({ employee, payroll }) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    {employee.profile
                      ? `${employee.profile.firstName} ${employee.profile.lastName}`
                      : employee.email}
                    <p className="text-xs text-slate-500">{employee.employeeId}</p>
                  </TableCell>
                  <TableCell>
                    {payroll ? formatCurrency(payroll.basicSalary) : "—"}
                  </TableCell>
                  <TableCell>
                    {payroll ? formatCurrency(payroll.allowances) : "—"}
                  </TableCell>
                  <TableCell>
                    {payroll ? formatCurrency(payroll.deductions) : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payroll ? formatCurrency(payroll.netSalary) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialog({ employee, payroll })}
                    >
                      {payroll ? "Edit" : "Set Salary"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        {dialog && (
          <>
            <DialogHeader>
              <DialogTitle>Update Salary Structure</DialogTitle>
              <DialogDescription>
                {dialog.employee.profile
                  ? `${dialog.employee.profile.firstName} ${dialog.employee.profile.lastName}`
                  : dialog.employee.email}{" "}
                – {month}
              </DialogDescription>
              <DialogClose onClick={() => setDialog(null)} />
            </DialogHeader>
            <div className="space-y-5">
              {/* Earnings */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Earnings
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="basic">Basic Salary</Label>
                    <Input id="basic" type="number" min={0} step="0.01" value={form.basicSalary} onChange={set("basicSalary")} />
                  </div>
                  <div>
                    <Label htmlFor="hra">HRA</Label>
                    <Input id="hra" type="number" min={0} step="0.01" value={form.hra} onChange={set("hra")} />
                  </div>
                  <div>
                    <Label htmlFor="otherAllowances">Other Allowances</Label>
                    <Input id="otherAllowances" type="number" min={0} step="0.01" value={form.otherAllowances} onChange={set("otherAllowances")} />
                  </div>
                </div>
                <p className="mt-1.5 text-right text-sm text-slate-500">
                  Total Earnings: <strong>{formatCurrency(form.basicSalary + totalAllowances)}</strong>
                </p>
              </div>

              {/* Deductions */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Deductions
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="pf">PF</Label>
                    <Input id="pf" type="number" min={0} step="0.01" value={form.pf} onChange={set("pf")} />
                  </div>
                  <div>
                    <Label htmlFor="tax">Tax</Label>
                    <Input id="tax" type="number" min={0} step="0.01" value={form.tax} onChange={set("tax")} />
                  </div>
                  <div>
                    <Label htmlFor="otherDeductions">Other Deductions</Label>
                    <Input id="otherDeductions" type="number" min={0} step="0.01" value={form.otherDeductions} onChange={set("otherDeductions")} />
                  </div>
                </div>
                <p className="mt-1.5 text-right text-sm text-slate-500">
                  Total Deductions: <strong>{formatCurrency(totalDeductions)}</strong>
                </p>
              </div>

              {/* Net */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
                <span className="text-sm font-medium">Net Salary (auto-computed)</span>
                <span className={`text-lg font-bold ${netSalary < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {formatCurrency(netSalary)}
                </span>
              </div>
              {netSalary < 0 && (
                <p className="text-sm text-red-600">
                  Deductions exceed earnings. Please review the values.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={updatePayroll.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updatePayroll.isPending || netSalary < 0}
              >
                {updatePayroll.isPending ? "Saving..." : "Save Payroll"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
