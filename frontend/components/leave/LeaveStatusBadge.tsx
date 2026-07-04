import { Badge } from "@/components/ui/badge";
import type { LeaveStatus } from "@/types";

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  if (status === "APPROVED") return <Badge variant="success">Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}
