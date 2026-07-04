"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers } from "@/lib/api/users";
import { registerUser } from "@/lib/api/auth";
import { getAuditLogs } from "@/lib/api/audit";
import { getLeaveRequests, updateLeaveRequest } from "@/lib/api/leave";
import { getAttendance } from "@/lib/api/attendance";
import {
  getPayrolls,
  getEmployeePayroll,
  updateEmployeePayroll,
} from "@/lib/api/payroll";
import type { AttendanceParams, LeaveParams } from "@/lib/api";
import type { LeaveAction, PayrollUpdate } from "@/types";
import { toast } from "@/lib/hooks/use-toast";

const todayIso = () => new Date().toISOString().split("T")[0];

export function useAdminStats() {
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const leaveQuery = useQuery({
    queryKey: ["leave", "admin"],
    queryFn: () => getLeaveRequests(),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () =>
      getAttendance({ dateFrom: todayIso(), dateTo: todayIso() }),
  });

  const employees = usersQuery.data ?? [];
  const leaves = leaveQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;

  return {
    employees,
    leaves,
    attendance,
    counts: {
      employees: employees.length,
      pendingLeaves,
      approvedLeaves,
      checkedInToday: attendance.filter((a) => a.checkIn).length,
    },
    isLoading:
      usersQuery.isLoading || leaveQuery.isLoading || attendanceQuery.isLoading,
    errors: [usersQuery.error, leaveQuery.error, attendanceQuery.error].filter(
      Boolean
    ),
  };
}

export function useLeaveRequests(params?: LeaveParams) {
  return useQuery({
    queryKey: ["leave", params ?? {}],
    queryFn: () => getLeaveRequests(params),
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveAction }) =>
      updateLeaveRequest(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
      toast({
        title: "Leave updated",
        description:
          variables.data.status === "APPROVED"
            ? "Leave request approved."
            : "Leave request rejected.",
      });
    },
  });
}

export function usePayrolls(month?: string) {
  return useQuery({
    queryKey: ["payroll", "all", month],
    queryFn: () => getPayrolls(month),
  });
}

export function useEmployeePayroll(
  employeeId: string | undefined,
  month?: string
) {
  return useQuery({
    queryKey: ["payroll", employeeId, month],
    queryFn: () =>
      employeeId ? getEmployeePayroll(employeeId, month) : Promise.resolve([]),
    enabled: !!employeeId,
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: PayrollUpdate;
    }) => updateEmployeePayroll(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payroll", "all"],
      });
      toast({ title: "Payroll updated", description: "Salary structure saved." });
    },
  });
}

export function useAttendanceRecords(params?: AttendanceParams) {
  return useQuery({
    queryKey: ["attendance", params ?? {}],
    queryFn: () => getAttendance(params),
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: "ADMIN" | "EMPLOYEE"; firstName: string; lastName: string; designation: string }) =>
      registerUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Employee created", description: "A setup email has been sent." });
    },
  });
}

export function useAuditLogs(params?: {
  action?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["audit", params ?? {}],
    queryFn: () => getAuditLogs(params),
  });
}
