"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, addMonths, subMonths } from "date-fns";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { skipWorkout } from "@/actions/schedule";

type CalendarDay = {
  id: string;
  date: string;
  status: string;
  workout: { name: string; exercises: { name: string; sets: number; minReps: number; maxReps: number }[] } | null;
  session: { duration: number | null } | null;
};

export function WorkoutCalendar({ initialDate, days }: { initialDate: Date; days: CalendarDay[] }) {
  const [month, setMonth] = useState(initialDate);
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const daysByDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of days) map.set(d.date, d);
    return map;
  }, [days]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7)); // Monday start

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium text-ink">{format(month, "MMMM yyyy")}</h1>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <CaretLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <CaretRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((d) => (
          <div key={d} className="pb-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const day = daysByDate.get(key);
          const inMonth = date.getMonth() === month.getMonth();
          const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <button
              key={key}
              type="button"
              disabled={!day || day.status === "REST"}
              onClick={() => day && setSelected(day)}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-none border text-sm transition-colors sm:h-20",
                !inMonth && "text-muted-foreground/40",
                inMonth && !day && "border-transparent",
                day?.status === "COMPLETED" && "border-success bg-success/10 text-success",
                day?.status === "SKIPPED" && "border-hairline bg-soft-cloud text-mute",
                day?.status === "PLANNED" && "border-info bg-info/10 text-info-deep hover:bg-info/20",
                day?.status === "REST" && inMonth && "border-border text-muted-foreground/50",
                isToday && "ring-2 ring-ink ring-offset-1"
              )}
            >
              <span className="text-xs font-medium">{date.getDate()}</span>
              {day?.workout && (
                <span className="hidden max-w-full truncate px-1 text-[10px] font-medium sm:block">
                  {day.workout.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.workout?.name ?? "Rest Day"}</DialogTitle>
                <DialogDescription>
                  {format(new Date(selected.date), "EEEE, MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {selected.workout && (
                  <div className="space-y-2">
                    {selected.workout.exercises.map((ex) => (
                      <div key={ex.name} className="flex items-center justify-between text-sm">
                        <span>{ex.name}</span>
                        <Badge variant="secondary">
                          {ex.sets} × {ex.minReps}{ex.minReps !== ex.maxReps ? `-${ex.maxReps}` : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      selected.status === "COMPLETED"
                        ? "success"
                        : selected.status === "SKIPPED"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {selected.status}
                  </Badge>
                  {selected.workout && selected.status === "PLANNED" && (
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <Link href={`/workout/${selected.id}`}>Start Workout</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await skipWorkout(selected.id);
                          setSelected(null);
                          window.location.reload();
                        }}
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
