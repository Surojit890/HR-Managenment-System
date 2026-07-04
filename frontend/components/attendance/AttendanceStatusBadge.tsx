import { Badge } from "@/components/ui/badge";

interface AttendanceStatusBadgeProps {
  checkIn?: string | null;
  checkOut?: string | null;
}

export function AttendanceStatusBadge({
  checkIn,
  checkOut,
}: AttendanceStatusBadgeProps) {
  if (checkIn && checkOut) return <Badge variant="success">Present</Badge>;
  if (checkIn) return <Badge variant="warning">Checked In</Badge>;
  return <Badge variant="danger">Absent</Badge>;
}
