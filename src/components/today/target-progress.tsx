"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function TargetProgress({
  label,
  current,
  target,
  unit = "",
}: {
  label: string;
  current: number | null | undefined;
  target: number | null | undefined;
  unit?: string;
}) {
  if (target == null || target <= 0) return null;
  const value = current ?? 0;
  const pct = Math.min(100, Math.round((value / target) * 100));
  const over = value > target;

  return (
    <div className="rounded-none border px-3 py-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-ink">
          {Math.round(value)}
          {unit ? ` / ${Math.round(target)} ${unit}` : ` / ${Math.round(target)}`}
          <span className={cn("ml-2 text-xs", over ? "text-sale" : "text-muted-foreground")}>{pct}%</span>
        </span>
      </div>
      <Progress
        value={pct}
        className="mt-1.5 h-1"
      />
    </div>
  );
}
