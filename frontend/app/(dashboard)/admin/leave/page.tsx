"use client";

import { useMemo, useState } from "react";
import { useEmployees, useLeaveRequests, useApproveLeave } from "@/lib/hooks/useAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveStatusBadge } from "@/components/leave/LeaveStatusBadge";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import type { LeaveRequest, LeaveStatus } from "@/types";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminLeavePage() {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const params = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(employeeId ? { userId: employeeId } : {}),
    }),
    [status, employeeId]
  );

  const { data: leaves = [], isLoading: loadingLeaves } = useLeaveRequests(params);
  const approveLeave = useApproveLeave();

  const [dialog, setDialog] = useState<{
    leave: LeaveRequest;
    action: LeaveStatus;
    comments: string;
  } | null>(null);

  const employeeOptions = useMemo(
    () => [
      { value: "", label: "All employees" },
      ...employees.map((e) => ({
        value: e.id,
        label: e.profile
          ? `${e.profile.firstName} ${e.profile.lastName} (${e.employeeId})`
          : e.employeeId,
      })),
    ],
    [employees]
  );

  const submitAction = () => {
    if (!dialog) return;
    approveLeave.mutate(
      {
        id: dialog.leave.id,
        data: { status: dialog.action, comments: dialog.comments },
      },
      { onSuccess: () => setDialog(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-slate-500">Review and respond to employee leave requests.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Status"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          label="Employee"
          options={employeeOptions}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          disabled={loadingEmployees}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingLeaves ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : leaves.length === 0 ? (
              <TableEmpty colSpan={6}>No leave requests found.</TableEmpty>
            ) : (
              leaves.map((leave) => {
                const employee = employees.find((e) => e.id === leave.userId);
                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      {employee?.profile
                        ? `${employee.profile.firstName} ${employee.profile.lastName}`
                        : employee?.employeeId ?? leave.userId}
                    </TableCell>
                    <TableCell className="capitalize">
                      {leave.type.replace("_", " ").toLowerCase()}
                    </TableCell>
                    <TableCell>
                      {formatDate(leave.from)} – {formatDate(leave.to)}
                    </TableCell>
                    <TableCell>{leave.remarks ?? "—"}</TableCell>
                    <TableCell>
                      <LeaveStatusBadge status={leave.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              setDialog({
                                leave,
                                action: "APPROVED",
                                comments: "",
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDialog({
                                leave,
                                action: "REJECTED",
                                comments: "",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Resolved</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        {dialog && (
          <>
            <DialogHeader>
              <DialogTitle>
                {dialog.action === "APPROVED" ? "Approve" : "Reject"} Leave
              </DialogTitle>
              <DialogDescription>
                {dialog.action === "APPROVED"
                  ? "Confirm approval of this leave request."
                  : "Please provide a reason for rejection."}
              </DialogDescription>
              <DialogClose onClick={() => setDialog(null)} />
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Leave period</Label>
                <p className="text-sm text-slate-700">
                  {formatDate(dialog.leave.from)} –{" "}
                  {formatDate(dialog.leave.to)}
                </p>
              </div>
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Input
                  id="comments"
                  placeholder="Optional comments"
                  value={dialog.comments}
                  onChange={(e) =>
                    setDialog({ ...dialog, comments: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={approveLeave.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={dialog.action === "REJECTED" ? "destructive" : "default"}
                onClick={submitAction}
                disabled={approveLeave.isPending}
              >
                {approveLeave.isPending
                  ? "Saving..."
                  : dialog.action === "APPROVED"
                  ? "Approve"
                  : "Reject"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
