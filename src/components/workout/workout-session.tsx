"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logSet, startSession, completeSession } from "@/actions/session";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  repRange: string;
  restTime: number | null;
};

type Log = {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number;
  rpe: number | null;
};

type SetState = { weight: string; reps: string; rpe: string };

export function WorkoutSession({
  scheduleId,
  workoutId,
  date,
  exercises,
  existingLogs,
  isCompleted,
}: {
  scheduleId: string;
  workoutId: string;
  date: string;
  exercises: Exercise[];
  existingLogs: Log[];
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(isCompleted);
  const [saving, setSaving] = useState(false);

  // initialize set states from existing logs
  const [sets, setSets] = useState<Record<string, SetState[]>>(() => {
    const map: Record<string, SetState[]> = {};
    for (const ex of exercises) {
      const rows: SetState[] = [];
      for (let i = 0; i < ex.sets; i++) {
        const log = existingLogs.find((l) => l.exerciseId === ex.id && l.setNumber === i + 1);
        rows.push({
          weight: log?.weight != null ? String(log.weight) : "",
          reps: log?.reps != null ? String(log.reps) : "",
          rpe: log?.rpe != null ? String(log.rpe) : "",
        });
      }
      map[ex.id] = rows;
    }
    return map;
  });

  useEffect(() => {
    if (completed) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);

  useEffect(() => {
    if (completed) return;
    void startSession(scheduleId);
  }, [completed, scheduleId]);

  function updateSet(exerciseId: string, index: number, field: keyof SetState, value: string) {
    setSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = next[exerciseId].map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return next;
    });
  }

  async function saveSet(exerciseId: string, index: number) {
    const row = sets[exerciseId][index];
    const reps = parseInt(row.reps, 10);
    if (Number.isNaN(reps)) return;
    await startSession(scheduleId);
    await logSet({
      scheduleId,
      exerciseId,
      setNumber: index + 1,
      weight: row.weight ? parseFloat(row.weight) : null,
      reps,
      rpe: row.rpe ? parseFloat(row.rpe) : null,
    });
  }

  async function saveSetValues(exerciseId: string, index: number, weight: string, reps: string, rpe: string) {
    const repsNum = parseInt(reps, 10);
    if (Number.isNaN(repsNum)) return;
    await startSession(scheduleId);
    await logSet({
      scheduleId,
      exerciseId,
      setNumber: index + 1,
      weight: weight ? parseFloat(weight) : null,
      reps: repsNum,
      rpe: rpe ? parseFloat(rpe) : null,
    });
  }

  function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function handleComplete() {
    setSaving(true);
    const logs = exercises.flatMap((ex) =>
      sets[ex.id]
        .map((row, i) => {
          const reps = parseInt(row.reps, 10);
          if (Number.isNaN(reps)) return null;
          return {
            exerciseId: ex.id,
            setNumber: i + 1,
            weight: row.weight ? parseFloat(row.weight) : null,
            reps,
            rpe: row.rpe ? parseFloat(row.rpe) : null,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null)
    );

    if (logs.length > 0) {
      await completeSession({
        scheduleId,
        workoutId,
        date,
        duration: Math.max(1, Math.round(elapsed / 60)),
        exerciseLogs: logs,
      });
    } else {
      await completeSession({
        scheduleId,
        workoutId,
        date,
        duration: Math.max(1, Math.round(elapsed / 60)),
        exerciseLogs: [{ exerciseId: exercises[0]?.id ?? "", setNumber: 1, reps: 0 }],
      });
    }

    setCompleted(true);
    setSaving(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{format(new Date(date), "EEEE, MMMM d")}</CardTitle>
            <CardDescription>
              {completed ? "Session complete" : `Elapsed: ${formatElapsed(elapsed)}`}
            </CardDescription>
          </div>
          {completed && <Badge variant="success">Completed</Badge>}
        </CardHeader>
      </Card>

      {exercises.map((ex) => {
        const targetReps = ex.repRange;
        return (
          <Card key={ex.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {ex.name}
                <Badge variant="secondary">
                  {ex.sets} × {targetReps}
                  {ex.restTime ? ` · ${ex.restTime}s rest` : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 sm:grid-cols-[2rem_1fr_1fr_1fr]">
                <div className="text-xs font-medium text-muted-foreground">Set</div>
                <div className="text-xs font-medium text-muted-foreground">Reps</div>
                <div className="text-xs font-medium text-muted-foreground">Weight</div>
                <div className="text-xs font-medium text-muted-foreground">RPE</div>

                {sets[ex.id]?.map((row, i) => (
                  <div key={i} className="contents">
                    <div className="flex items-center text-sm text-muted-foreground">{i + 1}</div>
                    <Input
                      className="h-8"
                      inputMode="numeric"
                      value={row.reps}
                      onChange={(e) => updateSet(ex.id, i, "reps", e.target.value)}
                      onBlur={() => saveSet(ex.id, i)}
                      placeholder="reps"
                    />
                    <Input
                      className="h-8"
                      inputMode="decimal"
                      value={row.weight}
                      onChange={(e) => updateSet(ex.id, i, "weight", e.target.value)}
                      onBlur={() => saveSet(ex.id, i)}
                      placeholder="kg"
                    />
                    <Select
                      value={row.rpe}
                      onValueChange={(v) => {
                        updateSet(ex.id, i, "rpe", v);
                        void saveSetValues(ex.id, i, row.weight, row.reps, v);
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="RPE" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                          <SelectItem key={rpe} value={String(rpe)}>
                            {rpe}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleComplete} disabled={saving || completed}>
          {completed ? "Completed" : saving ? "Saving…" : "Complete Workout"}
        </Button>
      </div>
    </div>
  );
}
