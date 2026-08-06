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
    <aside className="hidden w-56 shrink-0 flex-col border-r border-hairline bg-canvas md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-hairline px-4">
        <Barbell className="h-5 w-5 text-ink" />
        <span className="text-sm font-medium uppercase tracking-wider text-ink">Fitness Tracker</span>
      </div>
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-ink text-ink"
                  : "text-mute hover:bg-soft-cloud hover:text-ink"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-hairline py-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "border-ink text-ink"
              : "text-mute hover:bg-soft-cloud hover:text-ink"
          )}
        >
          <GearSix className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/workout/history"
          className={cn(
            "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/workout")
              ? "border-ink text-ink"
              : "text-mute hover:bg-soft-cloud hover:text-ink"
          )}
        >
          <Crosshair className="h-4 w-4" />
          Workout Log
        </Link>
      </div>
    </aside>
  );
}
