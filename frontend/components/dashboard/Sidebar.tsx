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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

  const handleLogout = () => {
    Cookies.remove("access_token");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <span className="text-lg font-bold text-slate-900">
          {isAdmin ? "Admin Portal" : "Employee Portal"}
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-64 bg-white p-4 shadow-xl">
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

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-bold text-slate-900">
            {isAdmin ? "Admin Portal" : "Employee Portal"}
          </span>
        </div>
        <NavContent
          nav={nav}
          pathname={pathname}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function NavContent({
  nav,
  pathname,
  isAdmin,
  onNavigate,
  onLogout,
}: {
  nav: NavItem[];
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between p-4">
      <nav className="space-y-1">
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 pt-4">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isAdmin ? "Admin" : "Employee"}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-red-600"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
