"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword, apiErrorMessage } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <p className="font-medium text-slate-900">Check your email</p>
                <p className="mt-1 text-sm text-slate-500">
                  If an account exists with that email, a password reset link has been sent.
                  The link will expire in 1 hour.
                </p>
              </div>
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Back to login
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((data) =>
                forgotMutation.mutate(data.email, {
                  onSuccess: () => setSent(true),
                })
              )}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {forgotMutation.error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {apiErrorMessage(forgotMutation.error, "Failed to send reset email.")}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? "Sending…" : "Send reset link"}
              </Button>

              <a
                href="/login"
                className="block text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Back to login
              </a>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
