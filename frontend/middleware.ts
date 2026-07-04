import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/verify", "/setup-password", "/forgot-password", "/reset-password"];

function decodeToken(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function defaultDashboard(role?: string) {
  return role === "ADMIN" || role === "HR" ? "/admin" : "/employee";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const payload = token ? decodeToken(token) : null;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (payload) {
      return NextResponse.redirect(
        new URL(defaultDashboard(payload.role), request.url)
      );
    }
    return NextResponse.next();
  }

  if (!token || !payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based path guard
  const isAdminPath = pathname.startsWith("/admin");
  const isEmployeePath = pathname.startsWith("/employee");

  if (isAdminPath && payload.role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/employee", request.url));
  }

  if (isEmployeePath && (payload.role === "ADMIN" || payload.role === "HR")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
