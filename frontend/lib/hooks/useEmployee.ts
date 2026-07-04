"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/api/profiles";
import { getAttendance, checkIn, checkOut } from "@/lib/api/attendance";
import { getLeaveRequests, createLeaveRequest } from "@/lib/api/leave";
import { getMyPayroll } from "@/lib/api/payroll";
import type { UpdateProfileData, CreateLeaveData } from "@/lib/api";
import { toast } from "@/lib/hooks/use-toast";

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
      toast({ title: "Profile updated", description: "Your changes have been saved." });
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
      toast({ title: "Avatar updated", description: "Your new photo is set." });
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
      toast({ title: "Checked in", description: "Have a great day!" });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Checked out", description: "See you tomorrow!" });
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
      toast({ title: "Leave submitted", description: "Your request is pending approval." });
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
