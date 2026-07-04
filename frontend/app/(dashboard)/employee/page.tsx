"use client";

import Link from "next/link";
import { UserCircle, CalendarClock, CalendarDays, CreditCard, LogIn, LogOut } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { LeaveStatusBadge } from "@/components/leave/LeaveStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyProfile,
  useMyAttendance,
  useMyLeave,
  useMyPayroll,
  useCheckIn,
  useCheckOut,
  useTodayAttendance,
} from "@/lib/hooks/useEmployee";
import { formatDate, formatDateTime, formatCurrency, initials, avatarUrl } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EmployeeDashboardPage() {
  const { data: profileData, isLoading: profileLoading } = useMyProfile();
  const { data: leaves = [], isLoading: leavesLoading } = useMyLeave();
  const { data: todayAttendance = [] } = useTodayAttendance();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: payroll = [] } = useMyPayroll(currentMonth);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const profile = profileData?.profile;
  const user = profileData?.user;

  const todayRecord = todayAttendance[0];
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;
  const latestPayroll = payroll[payroll.length - 1];

  const attendanceStatus = !todayRecord
    ? "Not checked in"
    : !todayRecord.checkOut
    ? `Checked in at ${formatDateTime(todayRecord.checkIn)}`
    : `Checked out at ${formatDateTime(todayRecord.checkOut)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={avatarUrl(profile?.avatarUrl)} />
          <AvatarFallback className="text-lg">
            {initials(profile?.firstName, profile?.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          {profileLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <h1 className="text-2xl font-bold text-slate-900">
              {profile
                ? `${profile.firstName} ${profile.lastName}`
                : user?.employeeId ?? "Welcome"}
            </h1>
          )}
          <p className="text-sm text-slate-500">
            {profile?.designation ?? user?.role ?? "Employee"}
            {profile?.department ? ` · ${profile.department}` : ""}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Status"
          value={todayRecord ? (todayRecord.checkOut ? "Done" : "Checked In") : "Absent"}
          icon={CalendarClock}
          subtitle={attendanceStatus}
          accent={todayRecord ? (todayRecord.checkOut ? "emerald" : "blue") : "amber"}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          icon={CalendarDays}
          subtitle="Awaiting approval"
          accent="amber"
        />
        <StatCard
          title="Approved Leaves"
          value={approvedLeaves}
          icon={CalendarDays}
          subtitle="Approved this cycle"
          accent="emerald"
        />
        <StatCard
          title="Net Salary"
          value={latestPayroll ? formatCurrency(latestPayroll.netSalary) : "—"}
          icon={CreditCard}
          subtitle={latestPayroll ? `For ${latestPayroll.month}` : "No payroll yet"}
          accent="violet"
        />
      </div>

      {/* Quick actions + recent leaves */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance quick actions */}
        <SectionCard title="Attendance">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">{attendanceStatus}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={!!todayRecord || checkInMutation.isPending}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" /> Check In
              </Button>
              <Button
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                disabled={!todayRecord || !!todayRecord.checkOut || checkOutMutation.isPending}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" /> Check Out
              </Button>
            </div>
            <Link href="/employee/attendance" className="text-sm text-blue-600 hover:underline">
              View full attendance history →
            </Link>
          </div>
        </SectionCard>

        {/* Recent leave requests */}
        <SectionCard
          title="Recent Leave Requests"
          action={
            <Link href="/employee/leave">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          }
        >
          {leavesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {leaves.slice(0, 5).map((leave) => (
                <li key={leave.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium capitalize">{leave.type.toLowerCase()}</span>
                    <span className="ml-2 text-slate-500">
                      {formatDate(leave.from)} – {formatDate(leave.to)}
                    </span>
                  </div>
                  <LeaveStatusBadge status={leave.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Quick nav */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/employee/profile", icon: UserCircle, label: "My Profile" },
          { href: "/employee/attendance", icon: CalendarClock, label: "Attendance" },
          { href: "/employee/leave", icon: CalendarDays, label: "Leave Requests" },
          { href: "/employee/payroll", icon: CreditCard, label: "Payroll" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:border-blue-300">
              <Icon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

