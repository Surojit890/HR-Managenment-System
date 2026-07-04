import Cookies from "js-cookie";
import { api } from "./client";
import type { User } from "@/types";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  employeeId: string;
  email: string;
  password: string;
  role: "ADMIN" | "EMPLOYEE";
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const loginUser = (data: LoginData) =>
  api.post<LoginResponse>("/auth/login", data).then((r) => r.data);

export const registerUser = (data: RegisterData) =>
  api.post<Omit<User, "isVerified">>("/auth/register", data).then((r) => r.data);

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export const verifyAccount = (token: string) =>
  api.get<{ message: string }>("/auth/verify", { params: { token } }).then((r) => r.data);

export const resendVerification = (email: string) =>
  api.post<{ message: string }>("/auth/resend-verification", { email }).then((r) => r.data);

// ─── Convenience aliases used by inline page implementations ─────────────────
export const login = loginUser;
export const register = registerUser;

/** Persists the JWT so both the axios interceptor and Next.js middleware can read it. */
export function setAuthToken(token: string) {
  Cookies.set("access_token", token, { expires: 7, sameSite: "strict" });
}

export function clearAuthToken() {
  Cookies.remove("access_token");
}

export function getAuthToken(): string | undefined {
  return Cookies.get("access_token");
}
