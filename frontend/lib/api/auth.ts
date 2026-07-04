import Cookies from "js-cookie";
import { api } from "./client";
import type { User } from "@/types";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  employeeId?: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  firstName: string;
  lastName: string;
  designation: string;
}

export interface SetupPasswordData {
  token: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const loginUser = (data: LoginData) =>
  api.post<LoginResponse>("/auth/login", data).then((r) => r.data);

export const registerUser = (data: RegisterData) =>
  api.post<Omit<User, "isVerified">>("/auth/register", data).then((r) => r.data);

export const refreshAccessToken = () =>
  api.post<{ access_token: string }>("/auth/refresh").then((r) => r.data);

export const logoutUser = () =>
  api.post<{ message: string }>("/auth/logout").then((r) => r.data);

export const setupPassword = (data: SetupPasswordData) =>
  api.post<{ message: string }>("/auth/setup-password", data).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data);

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export const verifyAccount = (token: string) =>
  api.get<{ message: string }>("/auth/verify", { params: { token } }).then((r) => r.data);

export const resendVerification = (email: string) =>
  api.post<{ message: string }>("/auth/resend-verification", { email }).then((r) => r.data);

export const login = loginUser;
export const register = registerUser;

export function setAuthToken(token: string) {
  Cookies.set("access_token", token, { expires: 7, sameSite: "strict" });
}

export function clearAuthToken() {
  Cookies.remove("access_token");
}

export function getAuthToken(): string | undefined {
  return Cookies.get("access_token");
}
