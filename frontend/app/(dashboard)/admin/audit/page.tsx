"use client";

import { useState } from "react";
import { useAuditLogs } from "@/lib/hooks/useAdmin";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { ShieldCheck } from "lucide-react";

const ACTIONS = [
  "ALL",
  "USER_CREATED",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "PASSWORD_SETUP",
  "PASSWORD_RESET_REQUESTED",
  "TOKEN_REFRESHED",
];

export default function AuditLogPage() {
  const [action, setAction] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading } = useAuditLogs({
    action: action === "ALL" ? undefined : action,
    page,
    pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500">
          Security event log — account creation, logins, password changes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a}
            onClick={() => {
              setAction(a);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              action === a
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableEmpty colSpan={5}>No audit logs found.</TableEmpty>
            ) : (
              items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user ? (
                      <span>
                        <span className="font-medium text-slate-900">
                          {log.user.employeeId}
                        </span>
                        <span className="ml-2 text-slate-500">{log.user.email}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {log.ip ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {log.metadata
                      ? (() => {
                          try {
                            const m = JSON.parse(log.metadata);
                            return Object.entries(m)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ");
                          } catch {
                            return log.metadata;
                          }
                        })()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} total events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
