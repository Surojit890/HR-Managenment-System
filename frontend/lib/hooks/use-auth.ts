"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  loginUser,
  registerUser,
  logoutUser,
  setupPassword,
  forgotPassword,
  setAuthToken,
  clearAuthToken,
} from "@/lib/api/auth";
import type { LoginData, RegisterData, SetupPasswordData } from "@/lib/api/auth";
import type { AxiosError } from "axios";
import { toast } from "@/lib/hooks/use-toast";

function apiErrorMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<{ message: string | string[] }>;
  const msg = axiosErr?.response?.data?.message;
  if (!msg) return fallback;
  return Array.isArray(msg) ? msg.join(", ") : msg;
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: LoginData) => loginUser(payload),
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      toast({ title: "Signed in", description: "Welcome back!" });
      if (data.user.role === "ADMIN" || data.user.role === "HR") {
        router.push("/admin");
      } else {
        router.push("/employee");
      }
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: RegisterData) => registerUser(payload),
    onSuccess: () => {
      toast({
        title: "Account created",
        description: "A password setup link has been emailed to the employee.",
      });
      router.push("/login?registered=1");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return async () => {
    try {
      await logoutUser();
    } catch {}
    clearAuthToken();
    toast({ title: "Signed out", description: "You have been logged out." });
    router.push("/login");
  };
}

export function useSetupPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: SetupPasswordData) => setupPassword(payload),
    onSuccess: () => {
      toast({
        title: "Password set",
        description: "You can now log in with your new password.",
      });
      router.push("/login?password_set=1");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: () => {
      toast({
        title: "Reset link sent",
        description: "If an account exists, a reset link has been emailed.",
      });
    },
  });
}

export { apiErrorMessage };
