"use client";

import { useMemo, useState } from "react";
import { useAttendanceRecords, useEmployees } from "@/lib/hooks/useAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/format";

export default function AdminAttendancePage() {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = useMemo(
    () => ({
      ...(employeeId ? { userId: employeeId } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [employeeId, dateFrom, dateTo]
  );

  const { data: records = [], isLoading: loadingRecords } =
    useAttendanceRecords(params);

  const employeeOptions = useMemo(
    () => [
      { value: "", label: "All employees" },
      ...employees.map((e) => ({
        value: e.id,
        label: e.profile
          ? `${e.profile.firstName} ${e.profile.lastName} (${e.employeeId})`
          : e.employeeId,
      })),
    ],
    [employees]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Records</h1>
        <p className="text-slate-500">Review daily and weekly attendance for all employees.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Employee"
          options={employeeOptions}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          disabled={loadingEmployees}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            From
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            To
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRecords ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableEmpty colSpan={5}>No attendance records found.</TableEmpty>
            ) : (
              records.map((record) => {
                const employee = employees.find((e) => e.id === record.userId);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {employee?.profile
                        ? `${employee.profile.firstName} ${employee.profile.lastName}`
                        : employee?.employeeId ?? record.userId}
                    </TableCell>
                    <TableCell>
                      {record.checkIn
                        ? formatDateTime(record.checkIn)
                        : "Not checked in"}
                    </TableCell>
                    <TableCell>
                      {record.checkOut
                        ? formatDateTime(record.checkOut)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {record.checkIn && record.checkOut ? (
                        <Badge variant="success">Present</Badge>
                      ) : record.checkIn ? (
                        <Badge variant="warning">Checked in</Badge>
                      ) : (
                        <Badge variant="danger">Absent</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
