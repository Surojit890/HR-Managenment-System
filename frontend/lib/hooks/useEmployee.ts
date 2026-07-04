"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/api/profiles";
import { getAttendance, checkIn, checkOut } from "@/lib/api/attendance";
import { getLeaveRequests, createLeaveRequest } from "@/lib/api/leave";
import { getMyPayroll } from "@/lib/api/payroll";
import type { UpdateProfileData, CreateLeaveData } from "@/lib/api";

// ─── Profile ────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ─── Attendance ─────────────────────────────────────────────────────────────

const todayIso = () => new Date().toISOString().split("T")[0];

export function useMyAttendance(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["attendance", "me", dateFrom, dateTo],
    queryFn: () => getAttendance({ dateFrom, dateTo }),
  });
}

export function useTodayAttendance(userId?: string) {
  const today = todayIso();
  return useQuery({
    queryKey: ["attendance", "today", userId],
    queryFn: () => getAttendance({ userId, dateFrom: today, dateTo: today }),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

// ─── Leave ───────────────────────────────────────────────────────────────────

export function useMyLeave(status?: string) {
  return useQuery({
    queryKey: ["leave", "me", status],
    queryFn: () => getLeaveRequests(status ? { status } : undefined),
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeaveData) => createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });
}

// ─── Payroll ─────────────────────────────────────────────────────────────────

export function useMyPayroll(month?: string) {
  return useQuery({
    queryKey: ["payroll", "me", month],
    queryFn: () => getMyPayroll(month),
  });
}
