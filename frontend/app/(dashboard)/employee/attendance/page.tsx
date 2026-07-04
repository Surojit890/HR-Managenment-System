"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Table, TableBody, TableCell, TableEmpty,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAttendance, useCheckIn, useCheckOut, useTodayAttendance } from "@/lib/hooks/useEmployee";
import { formatDate, formatDateTime } from "@/lib/format";
import { CalendarClock } from "lucide-react";

export default function EmployeeAttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const { data: records = [], isLoading } = useMyAttendance(dateFrom, dateTo);
  const { data: todayData = [] } = useTodayAttendance();
  const checkInM = useCheckIn();
  const checkOutM = useCheckOut();

  const todayRecord = todayData[0];

  const daysPresent = records.filter((r) => r.checkIn).length;
  const daysWithCheckout = records.filter((r) => r.checkOut).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>

      {/* Today action */}
      <SectionCard title="Today">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {!todayRecord && "You have not checked in today."}
            {todayRecord && !todayRecord.checkOut && (
              <span>Checked in at <strong>{formatDateTime(todayRecord.checkIn)}</strong></span>
            )}
            {todayRecord?.checkOut && (
              <span>
                Checked in at <strong>{formatDateTime(todayRecord.checkIn)}</strong> · Checked out at <strong>{formatDateTime(todayRecord.checkOut)}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => checkInM.mutate()}
              disabled={!!todayRecord || checkInM.isPending}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" /> Check In
            </Button>
            <Button
              variant="outline"
              onClick={() => checkOutM.mutate()}
              disabled={!todayRecord || !!todayRecord.checkOut || checkOutM.isPending}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" /> Check Out
            </Button>
          </div>
        </div>
        {(checkInM.error || checkOutM.error) && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {(checkInM.error as any)?.response?.data?.message ??
              (checkOutM.error as any)?.response?.data?.message ??
              "Action failed."}
          </p>
        )}
      </SectionCard>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Days Present" value={daysPresent} icon={CalendarClock} subtitle={`In selected range`} accent="emerald" />
        <StatCard title="Full Days" value={daysWithCheckout} icon={CalendarClock} subtitle="Check-in + check-out" accent="blue" />
        <StatCard title="Incomplete" value={daysPresent - daysWithCheckout} icon={CalendarClock} subtitle="Missing check-out" accent="amber" />
      </div>

      {/* History */}
      <SectionCard
        title="History"
        action={
          <div className="flex items-center gap-2 text-sm">
            <div>
              <Label className="sr-only">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <span className="text-slate-400">–</span>
            <div>
              <Label className="sr-only">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableEmpty colSpan={4}>No attendance records in this range.</TableEmpty>
              )}
              {records.map((r) => {
                const duration =
                  r.checkIn && r.checkOut
                    ? Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 60000)
                    : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{r.checkIn ? formatDateTime(r.checkIn) : "—"}</TableCell>
                    <TableCell>{r.checkOut ? formatDateTime(r.checkOut) : <span className="text-amber-600">Not checked out</span>}</TableCell>
                    <TableCell>{duration != null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

