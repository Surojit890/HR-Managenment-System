"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { login, resendVerification } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
  imageSrc: string;
}

const lightThemeVars = {
  "--background": "#ffffff",
  "--foreground": "#0f172a",
  "--card": "#ffffff",
  "--card-foreground": "#0f172a",
  "--muted": "#f1f5f9",
  "--muted-foreground": "#64748b",
  "--border": "#e2e8f0",
  "--input": "#e2e8f0",
  "--ring": "#6366f1",
  "--primary": "#6366f1",
  "--primary-foreground": "#ffffff",
  color: "#0f172a",
} as React.CSSProperties;

export function LoginForm({ imageSrc }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setUnverifiedEmail(null);
    setResendMsg(null);
    try {
      const res = await login(data);
      Cookies.set("access_token", res.access_token, { secure: false });
      const home = ["ADMIN", "HR"].includes(res.user.role) ? "/admin" : "/employee";
      router.push(home);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
      if (msg.toLowerCase().includes("not verified")) {
        setUnverifiedEmail(data.email);
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMsg(null);
    try {
      const res = await resendVerification(unverifiedEmail);
      setResendMsg(res.message);
    } catch (err: any) {
      setResendMsg(
        err?.response?.data?.message ?? "Failed to resend verification email.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="grid min-h-screen bg-background lg:grid-cols-2"
      style={lightThemeVars}
    >
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-bold text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </span>
            HRMS
          </Link>

          <div className="mt-12 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Holla,
              <br />
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Hey, welcome back to your workplace dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-[#6366f1] focus:ring-[#6366f1]"
                />
                <Label
                  htmlFor="remember"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-xs text-[#6366f1] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {unverifiedEmail && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-2">
                    <p>
                      We sent a verification link to{" "}
                      <span className="font-medium">{unverifiedEmail}</span>.
                      Check your inbox and click the link to activate your
                      account.
                    </p>
                    {resendMsg ? (
                      <p className="font-medium text-emerald-600">
                        {resendMsg}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="font-medium text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                      >
                        {resending
                          ? "Sending…"
                          : "Didn't receive it? Resend verification email"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-[#6366f1] hover:bg-[#4f46e5]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={imageSrc}
          alt="HRMS welcome"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
