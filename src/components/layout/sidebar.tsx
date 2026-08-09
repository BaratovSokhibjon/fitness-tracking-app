"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Barbell,
  CalendarDots,
  ChartLine,
  Crosshair,
  ForkKnife,
  Gauge,
  GearSix,
  House,
  Pulse,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Today", icon: House },
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
    ],
  },
  {
    label: "Training",
    items: [
      { href: "/calendar", label: "Calendar", icon: CalendarDots },
      { href: "/program", label: "Program", icon: Barbell },
      { href: "/workout/history", label: "Workout Log", icon: Crosshair, matchPrefix: "/workout" },
    ],
  },
  {
    label: "Tracking",
    items: [
      { href: "/progress", label: "Progress", icon: TrendUp },
      { href: "/history", label: "History", icon: ChartLine },
      { href: "/review", label: "Review", icon: Pulse },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Nutrition",
    items: [{ href: "/foods", label: "Foods", icon: ForkKnife }],
  },
];

type NavItem = (typeof navSections)[number]["items"][number];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href);
}

function NavItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  return (
    <Link
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
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sticky top-0 h-dvh w-56 shrink-0 flex-col overflow-hidden border-r border-hairline bg-linen md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-4">
        <svg className="h-6 w-6 text-ink shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g stroke="currentColor" strokeWidth="4" strokeLinecap="square">
            <line x1="25" y1="24" x2="25" y2="76"/><line x1="40" y1="24" x2="40" y2="76"/>
            <line x1="55" y1="24" x2="55" y2="76"/><line x1="70" y1="24" x2="70" y2="76"/>
          </g>
          <line x1="20" y1="18" x2="78" y2="80" stroke="#1e9e52" strokeWidth="4" strokeLinecap="square"/>
        </svg>
        <span className="text-sm font-medium uppercase tracking-wider text-ink">Somatix</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-3 pb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-hairline p-3">
        <p className="px-3 pb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          Settings
        </p>
        <NavItemLink
          item={{ href: "/profile", label: "Profile", icon: GearSix }}
          pathname={pathname}
        />
        <ThemeToggle />
      </div>
    </aside>
  );
}
