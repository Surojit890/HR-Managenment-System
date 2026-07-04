"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, X, ChevronLeft, ChevronRight, Paperclip,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isToday, parseISO, eachDayOfInterval,
} from "date-fns";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { LeaveStatusBadge } from "@/components/leave/LeaveStatusBadge";
import {
  Table, TableBody, TableCell, TableEmpty,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useMyLeave, useCreateLeave } from "@/lib/hooks/useEmployee";
import { formatDate } from "@/lib/format";
import type { LeaveType, LeaveRequest, LeaveStatus } from "@/types";

// ─── Leave balance configuration ──────────────────────────────────────────────

const LEAVE_ALLOCATIONS: Record<LeaveType, { total: number; label: string; color: string }> = {
  CASUAL:  { total: 12, label: "Casual",  color: "bg-blue-500" },
  SICK:    { total: 12, label: "Sick",    color: "bg-rose-500" },
  EARNED:  { total: 15, label: "Earned",  color: "bg-emerald-500" },
  UNPAID:  { total: 0,  label: "Unpaid",  color: "bg-amber-500" },
};

function computeLeaveDays(leaves: LeaveRequest[], type: LeaveType, status: LeaveStatus | "ALL" = "APPROVED") {
  return leaves
    .filter((l) => l.type === type && (status === "ALL" || l.status === status))
    .reduce((sum, l) => {
      const days = eachDayOfInterval({ start: parseISO(l.from), end: parseISO(l.to) }).length;
      return sum + days;
    }, 0);
}

// ─── Leave Balance Card ────────────────────────────────────────────────────────

function LeaveBalanceCard({ type, used }: { type: LeaveType; used: number }) {
  const cfg = LEAVE_ALLOCATIONS[type];
  const unlimited = cfg.total === 0;
  const pct = unlimited ? 0 : Math.min((used / cfg.total) * 100, 100);
  const remaining = unlimited ? "Unlimited" : `${Math.max(cfg.total - used, 0)} days left`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{cfg.label} Leave</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {used}
            <span className="text-sm font-normal text-slate-400">
              {unlimited ? "" : ` / ${cfg.total}`}
            </span>
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg.color} bg-opacity-10`}>
          <span className={`text-lg font-bold ${cfg.color.replace("bg-", "text-")}`}>{cfg.label[0]}</span>
        </div>
      </div>
      <div className="mt-3">
        {!unlimited && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${cfg.color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">{remaining}</p>
      </div>
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function LeaveCalendar({ leaves }: { leaves: LeaveRequest[] }) {
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [gridStart, gridEnd]);

  const leaveDates = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    for (const leave of leaves) {
      const range = eachDayOfInterval({ start: parseISO(leave.from), end: parseISO(leave.to) });
      for (const day of range) {
        const key = format(day, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(leave);
      }
    }
    return map;
  }, [leaves]);

  const statusColor = (status: string) => {
    if (status === "APPROVED") return "bg-emerald-500";
    if (status === "REJECTED") return "bg-rose-400";
    return "bg-amber-400";
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">
            {format(cursor, "MMMM yyyy")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-center text-xs font-medium text-slate-400">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayLeaves = leaveDates.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          return (
            <div
              key={key}
              className={`min-h-[64px] rounded-md border p-1.5 ${
                inMonth ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/50"
              } ${isToday(day) ? "ring-1 ring-blue-300" : ""}`}
            >
              <p className={`text-xs ${inMonth ? "text-slate-700" : "text-slate-300"} ${isToday(day) ? "font-bold text-blue-600" : ""}`}>
                {format(day, "d")}
              </p>
              <div className="mt-1 space-y-0.5">
                {dayLeaves.slice(0, 2).map((l, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white ${statusColor(l.status)}`}
                  >
                    <span className="truncate">{l.type.toLowerCase()}</span>
                  </div>
                ))}
                {dayLeaves.length > 2 && (
                  <p className="text-[10px] text-slate-400">+{dayLeaves.length - 2} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Rejected</span>
      </div>
    </div>
  );
}

// ─── Leave Form ────────────────────────────────────────────────────────────────

const schema = z.object({
  type: z.enum(["CASUAL", "SICK", "EARNED", "UNPAID"]),
  from: z.string().min(1, "Required"),
  to: z.string().min(1, "Required"),
  remarks: z.string().optional(),
  attachment: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function LeaveFormDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { mutate, isPending, error, reset: resetMutation } = useCreateLeave();
  const [fileName, setFileName] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "CASUAL" },
  });

  const onSubmit = (values: FormValues) => {
    mutate(
      {
        ...values,
        type: values.type as LeaveType,
        attachment: fileName || undefined,
      },
      {
        onSuccess: () => {
          reset();
          resetMutation();
          setFileName("");
          setOpen(false);
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    resetMutation();
    setFileName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(v); }}>
      <DialogHeader>
        <DialogTitle>Apply for Leave</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label>Leave Type</Label>
          <select
            {...register("type")}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="CASUAL">Casual</option>
            <option value="SICK">Sick</option>
            <option value="EARNED">Earned</option>
            <option value="UNPAID">Unpaid</option>
          </select>
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" {...register("from")} />
            {errors.from && <p className="text-xs text-red-500">{errors.from.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" {...register("to")} />
            {errors.to && <p className="text-xs text-red-500">{errors.to.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="remarks">Remarks (optional)</Label>
          <Input id="remarks" placeholder="Reason for leave…" {...register("remarks")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="attachment">Attachment (optional)</Label>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500">
              <Paperclip className="h-4 w-4" />
              {fileName || "Choose file"}
              <input
                id="attachment"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFileName(f.name);
                }}
              />
            </label>
            {fileName && (
              <button
                type="button"
                onClick={() => setFileName("")}
                className="text-xs text-slate-400 hover:text-rose-500"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">Upload medical certificate, supporting docs, etc.</p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {(error as any)?.response?.data?.message ?? "Failed to submit. Try again."}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            <X className="mr-1 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeeLeavePage() {
  const [open, setOpen] = useState(false);
  const { data: leaves = [], isLoading } = useMyLeave();

  const balances = useMemo(() => {
    return (Object.keys(LEAVE_ALLOCATIONS) as LeaveType[]).map((type) => ({
      type,
      used: computeLeaveDays(leaves, type),
    }));
  }, [leaves]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Time Off</h1>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balances.map(({ type, used }) => (
          <LeaveBalanceCard key={type} type={type} used={used} />
        ))}
      </div>

      {/* Calendar View */}
      <LeaveCalendar leaves={leaves} />

      {/* Leave Requests Table */}
      <SectionCard title="My Requests">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 && (
                <TableEmpty colSpan={7}>No leave requests yet. Click &apos;New Request&apos; to apply.</TableEmpty>
              )}
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="capitalize font-medium">{leave.type.toLowerCase()}</TableCell>
                  <TableCell>{formatDate(leave.from)}</TableCell>
                  <TableCell>{formatDate(leave.to)}</TableCell>
                  <TableCell className="text-slate-500">{leave.remarks ?? "—"}</TableCell>
                  <TableCell>
                    {leave.attachment ? (
                      <Badge variant="secondary" className="gap-1">
                        <Paperclip className="h-3 w-3" /> {leave.attachment}
                      </Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell><LeaveStatusBadge status={leave.status} /></TableCell>
                  <TableCell>{formatDate(leave.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <LeaveFormDialog open={open} setOpen={setOpen} />
    </div>
  );
}
