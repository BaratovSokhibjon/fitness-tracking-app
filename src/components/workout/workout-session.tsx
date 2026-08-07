"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Timer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logSet, startSession, completeSession } from "@/actions/session";
import { epley1RM } from "@/lib/utils";
import type { ExerciseHistoryRow } from "@/queries/records";

type ExerciseType = "WEIGHTED" | "BODYWEIGHT" | "TIMED";

type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  repRange: string;
  restTime: number | null;
  notes: string | null;
  mediaUrl: string | null;
};

type Log = {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  rpe: number | null;
};

type SetState = { weight: number | null; reps: number | null; durationSec: number | null; rpe: string };

type HistorySession = { date: Date; rows: ExerciseHistoryRow[] };

export function WorkoutSession({
  scheduleId,
  workoutId,
  date,
  exercises,
  historyByExercise,
  existingLogs,
  isCompleted,
}: {
  scheduleId: string;
  workoutId: string;
  date: string;
  exercises: Exercise[];
  historyByExercise: Record<string, HistorySession[]>;
  existingLogs: Log[];
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(isCompleted);
  const [saving, setSaving] = useState(false);

  // Rest timer state
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // initialize set states from existing logs
  const [sets, setSets] = useState<Record<string, SetState[]>>(() => {
    const map: Record<string, SetState[]> = {};
    for (const ex of exercises) {
      const rows: SetState[] = [];
      for (let i = 0; i < ex.sets; i++) {
        const log = existingLogs.find((l) => l.exerciseId === ex.id && l.setNumber === i + 1);
        rows.push({
          weight: log?.weight ?? null,
          reps: log?.reps ?? null,
          durationSec: log?.durationSec ?? null,
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

  // Clean up rest timer on unmount
  useEffect(() => {
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  function startRestTimer(seconds: number) {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    if (seconds <= 0) return;
    setRestSeconds(seconds);
    restTimerRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s == null || s <= 1) {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          restTimerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    setRestSeconds(null);
  }

  function updateSet(exerciseId: string, index: number, field: keyof SetState, value: string) {
    setSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = next[exerciseId].map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return next;
    });
  }

  function updateNumeric(exerciseId: string, index: number, field: "weight" | "reps" | "durationSec", value: number | null) {
    setSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = next[exerciseId].map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return next;
    });
  }

  function buildLog(exercise: Exercise, row: SetState, setNumber: number) {
    return {
      exerciseId: exercise.id,
      setNumber,
      weight: exercise.type === "WEIGHTED" ? row.weight : null,
      reps: exercise.type !== "TIMED" ? row.reps : null,
      durationSec: exercise.type === "TIMED" ? row.durationSec : null,
      rpe: row.rpe ? parseFloat(row.rpe) : null,
    };
  }

  function finishSet(exercise: Exercise, index: number) {
    const row = sets[exercise.id][index];
    const reps = exercise.type !== "TIMED" ? row.reps : null;
    const duration = exercise.type === "TIMED" ? row.durationSec : null;
    if (reps == null && duration == null) return;

    void (async () => {
      await startSession(scheduleId);
      await logSet({ scheduleId, ...buildLog(exercise, row, index + 1) });
    })();

    // Auto-start rest timer after the last logged set unless it's the final set.
    if (index < exercise.sets - 1 && exercise.restTime) {
      startRestTimer(exercise.restTime);
    }
  }

  async function saveSetValues(exercise: Exercise, index: number, rpe: string) {
    const row = sets[exercise.id][index];
    if (row.reps == null && row.durationSec == null) return;
    await startSession(scheduleId);
    await logSet({ scheduleId, ...buildLog(exercise, { ...row, rpe }, index + 1) });
  }

  function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatRest(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function handleComplete() {
    setSaving(true);
    stopRestTimer();
    const logs = exercises.flatMap((ex) =>
      sets[ex.id]
        .map((row, i) => {
          const reps = ex.type !== "TIMED" ? row.reps : null;
          const duration = ex.type === "TIMED" ? row.durationSec : null;
          if (reps == null && duration == null) return null;
          return buildLog(ex, row, i + 1);
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
        exerciseLogs: [{ exerciseId: exercises[0]?.id ?? "", setNumber: 1, reps: null }],
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

      {restSeconds !== null && (
        <Card className={restSeconds === 0 ? "border-emerald-300 bg-emerald-50/50" : "border-primary/40"}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Rest timer</p>
                <p className="text-2xl font-bold tabular-nums">
                  {restSeconds === 0 ? "Rest done — next set!" : formatRest(restSeconds)}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={stopRestTimer}>
              {restSeconds === 0 ? "Dismiss" : "Stop"}
            </Button>
          </CardContent>
        </Card>
      )}

      {exercises.map((ex) => {
        const history = historyByExercise[ex.id] ?? [];
        const lastSession = history[0];
        return (
          <Card key={ex.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {ex.name}
                  {ex.mediaUrl && (
                    <a
                      href={ex.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      reference
                    </a>
                  )}
                </span>
                <Badge variant="secondary">
                  {ex.sets} × {ex.repRange}
                  {ex.restTime ? ` · ${ex.restTime}s rest` : ""}
                </Badge>
              </CardTitle>
              {ex.notes && (
                <CardDescription className="text-xs">{ex.notes}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div
                className={
                  ex.type === "WEIGHTED"
                    ? "grid grid-cols-[2rem_1fr_1fr_1fr] gap-2"
                    : "grid grid-cols-[2rem_1fr_1fr] gap-2"
                }
              >
                <div className="text-xs font-medium text-muted-foreground">Set</div>
                <div className="text-xs font-medium text-muted-foreground">
                  {ex.type === "TIMED" ? "Time" : "Reps"}
                </div>
                {ex.type === "WEIGHTED" && (
                  <div className="text-xs font-medium text-muted-foreground">Weight</div>
                )}
                <div className="text-xs font-medium text-muted-foreground">RPE</div>

                {sets[ex.id]?.map((row, i) => {
                  const est1RM =
                    ex.type === "WEIGHTED" && row.reps != null && row.weight != null
                      ? epley1RM(row.weight, row.reps)
                      : null;
                  return (
                    <div key={i} className="contents">
                      <div className="flex items-center text-sm text-muted-foreground">{i + 1}</div>
                      {ex.type === "TIMED" ? (
                        <NumberInput
                          value={row.durationSec}
                          onValueChange={(v) => updateNumeric(ex.id, i, "durationSec", v)}
                          onCommit={() => finishSet(ex, i)}
                          min={0}
                          step={5}
                          decimals={0}
                          placeholder="sec"
                          aria-label={`${ex.name} set ${i + 1} duration`}
                        />
                      ) : (
                        <NumberInput
                          value={row.reps}
                          onValueChange={(v) => updateNumeric(ex.id, i, "reps", v)}
                          onCommit={() => finishSet(ex, i)}
                          min={0}
                          step={1}
                          decimals={0}
                          placeholder="reps"
                          aria-label={`${ex.name} set ${i + 1} reps`}
                        />
                      )}
                      {ex.type === "WEIGHTED" && (
                        <NumberInput
                          value={row.weight}
                          onValueChange={(v) => updateNumeric(ex.id, i, "weight", v)}
                          onCommit={() => finishSet(ex, i)}
                          min={0}
                          step={2.5}
                          decimals={1}
                          placeholder="kg"
                          aria-label={`${ex.name} set ${i + 1} weight`}
                        />
                      )}
                      <Select
                        value={row.rpe}
                        onValueChange={(v) => {
                          updateSet(ex.id, i, "rpe", v);
                          void saveSetValues(ex, i, v);
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
                      {est1RM != null && (
                        <div className="col-span-4 text-right text-xs text-muted-foreground">
                          est. 1RM: {est1RM} kg
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {lastSession && lastSession.rows.length > 0 && (
                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Last workout — {format(new Date(lastSession.date), "MMM d")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {lastSession.rows.map((r) => (
                      <Badge key={r.setNumber} variant="outline" className="text-xs">
                        {formatHistorySet(r, ex.type)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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

function formatHistorySet(r: ExerciseHistoryRow, type: ExerciseType): string {
  if (type === "TIMED") {
    return r.durationSec != null ? `${formatDuration(r.durationSec)}` : "—";
  }
  if (type === "WEIGHTED") {
    return `${r.weight != null ? `${r.weight}kg` : "BW"} × ${r.reps ?? "—"}`;
  }
  return `${r.reps ?? "—"} reps`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

