import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Registration Restricted</h1>
      <p className="mt-2 text-sm text-slate-500">
        New accounts can only be created by an administrator.
        Please contact your HR or Admin team to get access.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Back to Login
      </Link>
    </div>
  );
}

