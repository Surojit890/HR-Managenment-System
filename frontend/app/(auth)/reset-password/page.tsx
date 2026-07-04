"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PasswordSetForm } from "@/components/auth/password-set-form";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
        <p className="mt-2 text-sm text-gray-500">
          No reset token was found in the URL. Please check your email for the correct link.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Back to login
        </a>
      </div>
    );
  }

  return <PasswordSetForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
