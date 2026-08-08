"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveReviewNotes } from "@/actions/review";

export function WeeklySummary({
  weekNumber,
  habits,
  sessions,
  notes,
}: {
  weekNumber: number;
  habits: { name: string; completedDays: number; totalDays: number }[];
  sessions: { id: string; workoutName: string; date: string; setCount: number; duration: number | null }[];
  notes: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await saveReviewNotes(weekNumber, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No habit data this week.</p>
          ) : (
            habits.map((h) => (
              <div key={h.name} className="flex items-center justify-between text-sm">
                <span>{h.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {h.completedDays}/{h.totalDays || 7} days
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts completed this week.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.workoutName}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {format(new Date(s.date), "EEE MMM d")} · {s.setCount} sets
                    {s.duration ? ` · ${s.duration} min` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How did this week go? What should change next week?"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave}>{saved ? "Saved ✓" : "Save Notes"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
