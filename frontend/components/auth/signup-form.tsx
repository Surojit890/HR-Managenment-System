"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, apiErrorMessage } from "@/lib/hooks/use-auth";

const schema = z
  .object({
    employeeId: z.string().min(1, "Employee ID is required"),
    email: z.string().email("Enter a valid email"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    designation: z.string().min(1, "Designation is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["ADMIN", "EMPLOYEE"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const { mutate, isPending, error } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "EMPLOYEE" },
  });

  const onSubmit = ({ confirmPassword: _confirm, ...payload }: FormValues) => {
    mutate(payload);
  };

  const field = (
    id: keyof FormValues,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : undefined}
        {...register(id)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      {errors[id] && (
        <p className="mt-1 text-xs text-red-500">{errors[id]?.message as string}</p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">Join your company&apos;s HRMS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {field("employeeId", "Employee ID", "text", "EMP-001")}
        {field("email", "Email", "email", "you@company.com")}
        {field("firstName", "First Name", "text", "Alice")}
        {field("lastName", "Last Name", "text", "Williams")}
        {field("designation", "Designation", "text", "Senior Developer")}
        {field("password", "Password", "password", "Min. 8 characters")}
        {field("confirmPassword", "Confirm Password", "password", "••••••••")}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <select
            {...register("role")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {apiErrorMessage(error, "Registration failed. Please try again.")}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
