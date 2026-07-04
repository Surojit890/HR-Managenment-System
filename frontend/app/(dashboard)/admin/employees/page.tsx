"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEmployees, useCreateEmployee } from "@/lib/hooks/useAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, formatDate, avatarUrl } from "@/lib/format";
import type { UserWithProfile } from "@/types";

const createSchema = z.object({
  employeeId: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});
type CreateFormValues = z.infer<typeof createSchema>;

export default function AdminEmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserWithProfile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const fullName = emp.profile
        ? `${emp.profile.firstName} ${emp.profile.lastName}`.toLowerCase()
        : "";
      return (
        fullName.includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.profile?.department?.toLowerCase().includes(q) ||
        emp.profile?.designation?.toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500">Manage and view all employee records.</p>
        </div>
        <Button onClick={() => { reset(); setCreateOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, ID, email, department..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableEmpty colSpan={6}>No employees found.</TableEmpty>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {emp.profile?.avatarUrl && (
                          <AvatarImage src={avatarUrl(emp.profile.avatarUrl)} />
                        )}
                        <AvatarFallback>
                          {initials(
                            emp.profile?.firstName,
                            emp.profile?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">
                          {emp.profile
                            ? `${emp.profile.firstName} ${emp.profile.lastName}`
                            : emp.email}
                        </p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.employeeId}</TableCell>
                  <TableCell>{emp.profile?.department ?? "—"}</TableCell>
                  <TableCell>{emp.profile?.designation ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{emp.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(emp)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create Employee Dialog ───────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) reset(); }}>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Create a login account for the new employee.</DialogDescription>
          <DialogClose onClick={() => { setCreateOpen(false); reset(); }} />
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) =>
            createEmployee.mutate(values, {
              onSuccess: () => { setCreateOpen(false); reset(); },
            })
          )}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ce-empid">Employee ID</Label>
              <Input id="ce-empid" placeholder="EMP-010" {...register("employeeId")} />
              {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ce-role">Role</Label>
              <select
                id="ce-role"
                {...register("role")}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-email">Email</Label>
            <Input id="ce-email" type="email" placeholder="employee@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-password">Initial Password</Label>
            <Input id="ce-password" type="password" placeholder="Min. 8 characters" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {createEmployee.error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              {(createEmployee.error as any)?.response?.data?.message ?? "Failed to create employee."}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending ? "Creating…" : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ── View Employee Dialog ─────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <>
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                Full record for {selected.profile?.firstName ?? selected.email}.
              </DialogDescription>
              <DialogClose onClick={() => setSelected(null)} />
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Employee ID</p>
                  <p className="font-medium">{selected.employeeId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Role</p>
                  <p className="font-medium">{selected.role}</p>
                </div>
                <div>
                  <p className="text-slate-500">Verified</p>
                  <p className="font-medium">
                    {selected.isVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium">
                    {selected.profile?.phone ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Joined</p>
                  <p className="font-medium">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Department / Designation</p>
                <p className="font-medium">
                  {selected.profile?.department ?? "—"} /{" "}
                  {selected.profile?.designation ?? "—"}
                </p>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
