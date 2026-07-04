"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck, MailWarning, Loader2, Mail } from "lucide-react";
import { verifyAccount, resendVerification } from "@/lib/api/auth";
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

type State = "loading" | "success" | "error" | "resend";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    if (!token) {
      setState("resend");
      return;
    }

    verifyAccount(token)
      .then((res) => {
        setMessage(res.message);
        setState("success");
      })
      .catch((err) => {
        setMessage(
          err?.response?.data?.message ??
            "Verification failed. The link may be invalid or expired.",
        );
        setState("error");
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus("sending");
    try {
      const res = await resendVerification(resendEmail);
      setMessage(res.message);
      setResendStatus("sent");
    } catch (err: any) {
      setMessage(
        err?.response?.data?.message ?? "Failed to resend verification email.",
      );
      setResendStatus("error");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-600">Verifying your email…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <MailCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button className="w-full" onClick={() => router.push("/login")}>
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <MailWarning className="h-7 w-7 text-rose-600" />
            </div>
            <CardTitle className="text-2xl">Verification Failed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setState("resend");
                setMessage("");
              }}
            >
              <Mail className="mr-2 h-4 w-4" /> Resend Verification Email
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // resend form
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Resend Verification</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a new verification link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resendStatus === "sent" ? (
            <div className="space-y-4">
              <div className="rounded-md bg-emerald-50 p-3 text-center text-sm text-emerald-700">
                {message}
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="resend-email">Email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="you@company.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
              </div>
              {resendStatus === "error" && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {message}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Sending…" : "Send Verification Link"}
              </Button>
              <Button
                type="button"
                className="w-full"
                variant="ghost"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
