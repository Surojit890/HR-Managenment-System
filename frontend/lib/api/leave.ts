import { api } from "./client";
import type { LeaveRequest, LeaveAction, LeaveType } from "@/types";

export interface LeaveParams {
  userId?: string;
  status?: string;
}

export interface CreateLeaveData {
  type: LeaveType;
  from: string;
  to: string;
  remarks?: string;
  attachment?: string;
}

export const getLeaveRequests = (params?: LeaveParams) =>
  api.get<LeaveRequest[]>("/leave", { params }).then((res) => res.data);

export const createLeaveRequest = (data: CreateLeaveData) =>
  api.post<LeaveRequest>("/leave", data).then((res) => res.data);

export const updateLeaveRequest = (id: string, data: LeaveAction) =>
  api.patch<LeaveRequest>(`/leave/${id}`, data).then((res) => res.data);
