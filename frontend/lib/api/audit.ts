import { api } from "./client";
import type { AuditLogResponse } from "@/types";

export function getAuditLogs(params?: {
  action?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}) {
  return api
    .get<AuditLogResponse>("/audit", { params })
    .then((r) => r.data);
}
