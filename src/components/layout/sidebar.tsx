"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Barbell,
  CalendarDots,
  ChartLine,
  Crosshair,
  ForkKnife,
  GearSix,
  House,
  Pulse,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Today", icon: House },
  { href: "/history", label: "History", icon: ChartLine },
  { href: "/calendar", label: "Calendar", icon: CalendarDots },
  { href: "/program", label: "Program", icon: Barbell },
  { href: "/progress", label: "Progress", icon: TrendUp },
  { href: "/foods", label: "Foods", icon: ForkKnife },
  { href: "/review", label: "Review", icon: Pulse },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sticky top-0 h-dvh w-56 shrink-0 flex-col overflow-hidden border-r border-hairline bg-linen md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-4">
        <Barbell className="h-5 w-5 text-ink" />
        <span className="text-sm font-medium uppercase tracking-wider text-ink">Somatix</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border border-hairline bg-canvas text-ink"
                  : "text-mute hover:bg-cloud hover:text-ink"
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-success")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-hairline p-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "border border-hairline bg-canvas text-ink"
              : "text-mute hover:bg-cloud hover:text-ink"
          )}
        >
          <GearSix className={cn("h-4 w-4", pathname === "/profile" && "text-success")} />
          Profile
        </Link>
        <Link
          href="/workout/history"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/workout")
              ? "border border-hairline bg-canvas text-ink"
              : "text-mute hover:bg-cloud hover:text-ink"
          )}
        >
          <Crosshair className={cn("h-4 w-4", pathname.startsWith("/workout") && "text-success")} />
          Workout Log
        </Link>
      </div>
    </aside>
  );
}
