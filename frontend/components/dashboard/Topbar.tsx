"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

function pageTitle(pathname: string) {
  if (pathname === "/admin" || pathname === "/employee") return "Dashboard";
  const segment = pathname.split("/").pop() ?? "";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border bg-card/80 px-6 py-3 backdrop-blur md:flex">
      <h2 className="text-lg font-semibold text-foreground">
        {pageTitle(pathname)}
      </h2>
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 border-0 bg-muted pl-9 text-sm"
          />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
