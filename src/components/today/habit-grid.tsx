"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleHabit } from "@/actions/habits";

export function HabitGrid({
  date,
  habits,
}: {
  date: string;
  habits: { id: string; name: string; completed: boolean }[];
}) {
  const [items, setItems] = useState(habits);

  async function handleToggle(id: string, completed: boolean) {
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, completed } : h)));
    await toggleHabit({ habitId: id, date, completed });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Habits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => handleToggle(h.id, !h.completed)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  h.completed
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {h.completed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{h.name}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
