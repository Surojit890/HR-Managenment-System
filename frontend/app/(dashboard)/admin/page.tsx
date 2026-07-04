"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Users,
  Clock,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  Building2,
  Wallet,
  Plane,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminStats,
  useApproveLeave,
  usePayrolls,
} from "@/lib/hooks/useAdmin";
import { formatDate, formatCurrency, initials, avatarUrl } from "@/lib/format";
import type { UserWithProfile } from "@/types";

export default function AdminDashboardPage() {
  const { counts, employees, leaves, attendance, isLoading } = useAdminStats();
  const [selectedEmployee, setSelectedEmployee] = useState<UserWithProfile | null>(
    null
  );
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: payrolls = [], isLoading: payrollLoading } =
    usePayrolls(currentMonth);
  const approveLeave = useApproveLeave();

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").slice(0, 5);
  const recentEmployees = employees.slice(0, 5);

  const employeeMap = useMemo(() => {
    const map = new Map<string, UserWithProfile>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const departments = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    employees.forEach((emp) => {
      const dept = emp.profile?.department ?? "Unassigned";
      deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
    });
    return Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  const payrollSummary = useMemo(() => {
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    return { totalNet, count: payrolls.length };
  }, [payrolls]);

  const handleLeaveAction = (id: string, status: "APPROVED" | "REJECTED") => {
    approveLeave.mutate({ id, data: { status } });
  };

  const todayLabel = format(new Date(), "EEEE, MMMM d, yyyy");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const getEmployeeStatus = (employeeId: string) => {
    const hasAttendanceToday = attendance.some((a) => a.userId === employeeId);
    if (hasAttendanceToday) {
      return {
        key: "present" as const,
        label: "Present in office",
      };
    }

    const onApprovedLeave = leaves.some((leave) => {
      if (leave.userId !== employeeId || leave.status !== "APPROVED") return false;
      const from = new Date(leave.from);
      const to = new Date(leave.to);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return todayStart >= from && todayStart <= to;
    });

    if (onApprovedLeave) {
      return {
        key: "leave" as const,
        label: "On leave",
      };
    }

    return {
      key: "absent" as const,
      label: "Absent",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500">
          {todayLabel} &middot; Overview of employees, attendance, leave, and
          payroll.
        </p>
      </div>

      <SectionCard
        title="Employee Directory"
        action={
          <Link href="/admin/employees">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      >
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No employees found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {employees.slice(0, 12).map((emp) => {
              const status = getEmployeeStatus(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedEmployee(emp)}
                  className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <Avatar className="h-11 w-11">
                      {emp.profile?.avatarUrl && <AvatarImage src={avatarUrl(emp.profile.avatarUrl)} />}
                      <AvatarFallback>
                        {initials(emp.profile?.firstName, emp.profile?.lastName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex items-center gap-1.5 text-xs">
                      {status.key === "present" && (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-700">Present</span>
                        </>
                      )}
                      {status.key === "leave" && (
                        <>
                          <Plane className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-blue-700">Leave</span>
                        </>
                      )}
                      {status.key === "absent" && (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          <span className="text-amber-700">Absent</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="line-clamp-1 font-semibold text-slate-900 group-hover:text-slate-700">
                    {emp.profile
                      ? `${emp.profile.firstName} ${emp.profile.lastName}`
                      : emp.employeeId}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{emp.employeeId}</p>
                  <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                    {emp.profile?.department ?? "Unassigned"}
                    {emp.profile?.designation ? ` · ${emp.profile.designation}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={counts.employees}
            icon={Users}
            subtitle="Registered workforce"
            accent="blue"
          />
          <StatCard
            title="Pending Leaves"
            value={counts.pendingLeaves}
            icon={Clock}
            subtitle="Awaiting approval"
            accent="amber"
          />
          <StatCard
            title="Approved Leaves"
            value={counts.approvedLeaves}
            icon={CheckCircle2}
            subtitle="This cycle"
            accent="emerald"
          />
          <StatCard
            title="Checked-in Today"
            value={counts.checkedInToday}
            icon={CalendarClock}
            subtitle={`Out of ${counts.employees} employees`}
            accent="violet"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Pending Leave Requests"
          action={
            <Link href="/admin/leave">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : pendingLeaves.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No pending leave requests.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.map((leave) => {
                const employee = employeeMap.get(leave.userId);
                return (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {employee?.profile
                          ? `${employee.profile.firstName} ${employee.profile.lastName}`
                          : employee?.employeeId ?? "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {leave.type.replace("_", " ")} &middot;{" "}
                        {formatDate(leave.from)} &ndash; {formatDate(leave.to)}
                      </p>
                      {leave.remarks && (
                        <p className="text-xs text-slate-400">{leave.remarks}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLeaveAction(leave.id, "APPROVED")}
                        disabled={approveLeave.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                        disabled={approveLeave.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Today's Attendance"
          action={
            <Link href="/admin/attendance">
              <Button variant="ghost" size="sm" className="gap-1">
                Records <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : attendance.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No check-ins recorded today.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {attendance.slice(0, 6).map((record) => {
                const employee = employeeMap.get(record.userId);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {employee?.profile?.avatarUrl && (
                          <AvatarImage src={avatarUrl(employee.profile.avatarUrl)} />
                        )}
                        <AvatarFallback>
                          {initials(
                            employee?.profile?.firstName,
                            employee?.profile?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">
                          {employee?.profile
                            ? `${employee.profile.firstName} ${employee.profile.lastName}`
                            : employee?.employeeId ?? record.userId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {employee?.profile?.designation ?? "—"}
                        </p>
                      </div>
                    </div>
                    <AttendanceStatusBadge
                      checkIn={record.checkIn}
                      checkOut={record.checkOut}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Department Overview"
          action={
            <Link href="/admin/employees">
              <Button variant="ghost" size="sm" className="gap-1">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : departments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No department data available.
            </p>
          ) : (
            <div className="space-y-3">
              {departments.map(([dept, count]) => {
                const pct = Math.round((count / employees.length) * 100);
                return (
                  <div key={dept}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {dept}
                        </span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Payroll Summary"
          action={
            <Link href="/admin/payroll">
              <Button variant="ghost" size="sm" className="gap-1">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        >
          {isLoading || payrollLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-50">
                  <Wallet className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Total payroll &middot; {format(new Date(), "MMMM yyyy")}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(payrollSummary.totalNet)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Salaries configured</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {payrollSummary.count}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / {counts.employees}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Pending setup</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {counts.employees - payrollSummary.count}
                  </p>
                </div>
              </div>
              {counts.employees - payrollSummary.count > 0 && (
                <Link href="/admin/payroll">
                  <Button variant="outline" className="w-full">
                    Configure remaining salaries
                  </Button>
                </Link>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recent Employees"
          action={
            <Link href="/admin/employees">
              <Button variant="ghost" size="sm" className="gap-1">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recentEmployees.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No employees found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {emp.profile?.avatarUrl && (
                        <AvatarImage src={avatarUrl(emp.profile.avatarUrl)} />
                      )}
                      <AvatarFallback>
                        {initials(
                          emp.profile?.firstName,
                          emp.profile?.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">
                        {emp.profile
                          ? `${emp.profile.firstName} ${emp.profile.lastName}`
                          : emp.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {emp.employeeId} &middot;{" "}
                        {emp.profile?.designation ?? "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{emp.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick Links" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/employees">
              <Button variant="outline" className="h-auto w-full justify-start p-4">
                <Users className="mr-3 h-5 w-5 text-slate-500" />
                <div className="text-left">
                  <p className="font-medium">Employees</p>
                  <p className="text-xs font-normal text-slate-500">
                    View and manage employee records
                  </p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="outline" className="h-auto w-full justify-start p-4">
                <CalendarClock className="mr-3 h-5 w-5 text-slate-500" />
                <div className="text-left">
                  <p className="font-medium">Attendance</p>
                  <p className="text-xs font-normal text-slate-500">
                    Monitor daily and weekly attendance
                  </p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/leave">
              <Button variant="outline" className="h-auto w-full justify-start p-4">
                <Clock className="mr-3 h-5 w-5 text-slate-500" />
                <div className="text-left">
                  <p className="font-medium">Leave Approvals</p>
                  <p className="text-xs font-normal text-slate-500">
                    Approve or reject leave requests
                  </p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/payroll">
              <Button variant="outline" className="h-auto w-full justify-start p-4">
                <Wallet className="mr-3 h-5 w-5 text-slate-500" />
                <div className="text-left">
                  <p className="font-medium">Payroll</p>
                  <p className="text-xs font-normal text-slate-500">
                    Update salary structures
                  </p>
                </div>
              </Button>
            </Link>
          </div>
        </SectionCard>
      </div>

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        {selectedEmployee && (
          <>
            <DialogHeader>
              <DialogTitle>Employee Information</DialogTitle>
              <DialogDescription>
                View-only record for {selectedEmployee.profile?.firstName ?? selectedEmployee.email}.
              </DialogDescription>
              <DialogClose onClick={() => setSelectedEmployee(null)} />
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {selectedEmployee.profile?.avatarUrl && (
                    <AvatarImage src={avatarUrl(selectedEmployee.profile.avatarUrl)} />
                  )}
                  <AvatarFallback>
                    {initials(
                      selectedEmployee.profile?.firstName,
                      selectedEmployee.profile?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedEmployee.profile
                      ? `${selectedEmployee.profile.firstName} ${selectedEmployee.profile.lastName}`
                      : selectedEmployee.employeeId}
                  </p>
                  <p className="text-xs text-slate-500">{selectedEmployee.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Employee ID</p>
                  <p className="font-medium">{selectedEmployee.employeeId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Role</p>
                  <p className="font-medium">{selectedEmployee.role}</p>
                </div>
                <div>
                  <p className="text-slate-500">Department</p>
                  <p className="font-medium">{selectedEmployee.profile?.department ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Designation</p>
                  <p className="font-medium">{selectedEmployee.profile?.designation ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium">{selectedEmployee.profile?.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Joined</p>
                  <p className="font-medium">{formatDate(selectedEmployee.createdAt)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
