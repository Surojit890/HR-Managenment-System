import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccentColor = "blue" | "amber" | "emerald" | "violet";

const accentStyles: Record<AccentColor, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-blue-500/25",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/25",
  emerald: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/25",
  violet: "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-violet-500/25",
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  accent?: AccentColor;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg",
            accent ? accentStyles[accent] : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
