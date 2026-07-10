import { format, parseISO } from "date-fns";
import { getApiBaseUrl } from "@/lib/api/client";

export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

export function avatarUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${getApiBaseUrl()}${path}`;
}
