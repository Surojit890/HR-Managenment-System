// Shared TypeScript types aligned with the PostgreSQL schema

export type Role = "ADMIN" | "HR" | "EMPLOYEE"; // HR is treated identically to ADMIN

export interface User {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;
  personalEmail?: string;
  address?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  checkIn: string;
  checkOut?: string;
  date: string;
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "UNPAID";

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  from: string;
  to: string;
  remarks?: string;
  attachment?: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface Payroll {
  id: string;
  userId: string;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  allowances: number;
  pf: number;
  tax: number;
  otherDeductions: number;
  deductions: number;
  netSalary: number;
  month: string; // "YYYY-MM"
  updatedAt: string;
}

export interface UserWithProfile extends User {
  profile: EmployeeProfile | null;
}

export interface LeaveAction {
  status: LeaveStatus;
  comments?: string;
}

export interface PayrollUpdate {
  basicSalary: number;
  hra?: number;
  otherAllowances?: number;
  pf?: number;
  tax?: number;
  otherDeductions?: number;
  month: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}
