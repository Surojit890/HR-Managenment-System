"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarDays,
  CreditCard,
  UserCircle,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { logoutUser } from "@/lib/api/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarClock },
  { label: "Leave", href: "/admin/leave", icon: CalendarDays },
  { label: "Payroll", href: "/admin/payroll", icon: CreditCard },
  { label: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
];

const employeeNav: NavItem[] = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { label: "Profile", href: "/employee/profile", icon: UserCircle },
  { label: "Attendance", href: "/employee/attendance", icon: CalendarClock },
  { label: "Leave", href: "/employee/leave", icon: CalendarDays },
  { label: "Payroll", href: "/employee/payroll", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const nav = isAdmin ? adminNav : employeeNav;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hrms-sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hrms-sidebar-collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    Cookies.remove("access_token");
    window.location.href = "/login";
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link href={isAdmin ? "/admin" : "/employee"} className="flex items-center gap-2">
          <BrandIcon />
          <span className="text-lg font-bold text-foreground">HRMS</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-72 bg-card p-4 shadow-xl">
            <NavContent
              nav={nav}
              pathname={pathname}
              isAdmin={isAdmin}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <aside
        className={cn(
          "sticky top-0 hidden h-screen flex-col border-r border-border bg-card transition-[width] duration-300 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href={isAdmin ? "/admin" : "/employee"}
            className={cn(
              "flex items-center gap-2",
              collapsed && "hidden"
            )}
          >
            <BrandIcon />
            <span className="text-lg font-bold text-foreground">HRMS</span>
          </Link>
          {collapsed && <BrandIcon />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <NavContent
          nav={nav}
          pathname={pathname}
          isAdmin={isAdmin}
          collapsed={collapsed}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function BrandIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    </span>
  );
}

function NavContent({
  nav,
  pathname,
  isAdmin,
  collapsed,
  onNavigate,
  onLogout,
}: {
  nav: NavItem[];
  pathname: string;
  isAdmin: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col justify-between overflow-hidden",
        collapsed ? "p-3" : "p-4"
      )}
    >
      <nav className="space-y-1.5">
        {nav.map((item) => {
          const isRootDashboard = item.href === "/admin" || item.href === "/employee";
          const active = isRootDashboard
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl py-2.5 text-sm font-medium transition-all",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-border pt-4", collapsed && "px-1")}>
        <div
          className={cn(
            "mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
            collapsed && "sr-only"
          )}
        >
          {isAdmin ? "Admin Portal" : "Employee Portal"}
        </div>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center text-muted-foreground hover:text-foreground",
              collapsed ? "h-9 w-9 justify-center px-0" : "w-full justify-start"
            )}
            onClick={onLogout}
            title="Log out"
          >
            <LogOut className={cn("h-[18px] w-[18px]", !collapsed && "mr-2")} />
            <span className={cn(collapsed && "sr-only")}>Log out</span>
          </Button>
          <div className={cn(collapsed && "hidden")}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
