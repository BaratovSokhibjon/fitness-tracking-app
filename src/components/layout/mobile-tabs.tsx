"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Barbell,
  CalendarDots,
  ChartLine,
  Crosshair,
  DotsThree,
  ForkKnife,
  GearSix,
  House,
  Pulse,
  Target,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryTabs = [
  { href: "/", label: "Today", icon: House },
  { href: "/calendar", label: "Calendar", icon: CalendarDots },
  { href: "/program", label: "Program", icon: Barbell },
  { href: "/dashboard", label: "Stats", icon: ChartLine },
];

const overflowSections = [
  {
    label: "Training",
    items: [
      { href: "/workout/history", label: "Workout Log", icon: Crosshair },
    ],
  },
  {
    label: "Tracking",
    items: [
      { href: "/progress", label: "Progress", icon: ChartLine },
      { href: "/history", label: "History", icon: ChartLine },
      { href: "/review", label: "Review", icon: Pulse },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Nutrition",
    items: [{ href: "/foods", label: "Foods", icon: ForkKnife }],
  },
  {
    label: "Settings",
    items: [{ href: "/profile", label: "Profile", icon: GearSix }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

export function MobileTabs() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-linen pb-[env(safe-area-inset-bottom,0)] md:hidden">
      <div className="flex items-stretch justify-around">
        {primaryTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-ink" : "text-mute"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active && "text-success")} />
              {tab.label}
            </Link>
          );
        })}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-mute"
            >
              <DotsThree className="h-5 w-5" />
              More
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>More</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {overflowSections.map((section) => (
                <div key={section.label}>
                  <p className="px-1 pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
                    {section.label}
                  </p>
                  <div className="grid gap-1">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                            active ? "bg-cloud text-ink" : "text-mute hover:bg-cloud"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                    {section.label === "Settings" && <ThemeToggle />}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
