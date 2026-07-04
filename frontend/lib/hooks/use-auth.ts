"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, setAuthToken, clearAuthToken } from "@/lib/api/auth";
import type { LoginData, RegisterData } from "@/lib/api/auth";
import type { AxiosError } from "axios";

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
      router.push("/login?registered=1");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearAuthToken();
    router.push("/login");
  };
}

export { apiErrorMessage };
