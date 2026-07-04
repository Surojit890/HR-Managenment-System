import { api } from "./client";
import type { AttendanceRecord } from "@/types";

export interface AttendanceParams {
  userId?: string;
  dateFrom?: string; // ISO date
  dateTo?: string;
}

export const getAttendance = (params?: AttendanceParams) =>
  api.get<AttendanceRecord[]>("/attendance", { params }).then((res) => res.data);

export const checkIn = () =>
  api.post<AttendanceRecord>("/attendance/check-in").then((res) => res.data);

export const checkOut = () =>
  api.post<AttendanceRecord>("/attendance/check-out").then((res) => res.data);
