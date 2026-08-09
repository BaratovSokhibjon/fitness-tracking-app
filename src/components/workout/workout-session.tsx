"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, Plus, Timer, Trash, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logSet, startSession, completeSession, deleteSetLog } from "@/actions/session";
import { searchExerciseLibrary, createSessionExercise, deleteExercise } from "@/actions/workout";
import { epley1RM } from "@/lib/utils";
import type { ExerciseHistoryRow } from "@/queries/records";
import type { WeekSchemeResult } from "@/lib/progression";
import { computeWarmupSets, computePlateLoad, compareSession, type SessionComparison } from "@/lib/progression";

type ExerciseType = "WEIGHTED" | "BODYWEIGHT" | "TIMED";

export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  minReps: number;
  maxReps: number;
  restTime: number | null;
  notes: string | null;
  mediaUrl: string | null;
  scheme: WeekSchemeResult | null;
};

type Log = {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  rpe: number | null;
  notes: string | null;
};

type SetState = { weight: number | null; reps: number | null; durationSec: number | null; rpe: string; notes: string };

type HistorySession = { date: Date; rows: ExerciseHistoryRow[] };

type ExercisePR = {
  maxWeight: number | null;
  best1RM: number | null;
  maxReps: number | null;
  maxDurationSec: number | null;
};

export function WorkoutSession({
  scheduleId,
  workoutId,
  date,
  exercises,
  historyByExercise,
  prs,
  existingLogs,
  isCompleted,
}: {
  scheduleId: string;
  workoutId: string;
  date: string;
  exercises: Exercise[];
  historyByExercise: Record<string, HistorySession[]>;
  prs: Record<string, ExercisePR>;
  existingLogs: Log[];
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(isCompleted);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<SessionComparison[] | null>(null);
  const [prNames, setPrNames] = useState<string[]>([]);
  const [extraExercises, setExtraExercises] = useState<Exercise[]>([]);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraQuery, setExtraQuery] = useState("");
  const [extraResults, setExtraResults] = useState<Awaited<ReturnType<typeof searchExerciseLibrary>>>([]);

  // Rest timer state
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // initialize set states from existing logs
  const [sets, setSets] = useState<Record<string, SetState[]>>(() => {
    const map: Record<string, SetState[]> = {};
    for (const ex of exercises) {
      const exLogs = existingLogs.filter((l) => l.exerciseId === ex.id);
      const maxLoggedSet = exLogs.reduce((m, l) => Math.max(m, l.setNumber), 0);
      const rowCount = Math.max(ex.sets, maxLoggedSet);
      const rows: SetState[] = [];
      for (let i = 0; i < rowCount; i++) {
        const log = exLogs.find((l) => l.setNumber === i + 1);
        const schemeWeight = ex.scheme?.weights?.[i] ?? null;
        rows.push({
          weight: log?.weight ?? schemeWeight,
          reps: log?.reps ?? null,
          durationSec: log?.durationSec ?? null,
          rpe: log?.rpe != null ? String(log.rpe) : "",
          notes: log?.notes ?? "",
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
      notes: row.notes ? row.notes : null,
    };
  }

  function finishSet(exercise: Exercise, index: number, overrides?: Partial<Pick<SetState, "reps" | "weight" | "durationSec">>) {
    const row = { ...sets[exercise.id][index], ...overrides };
    const reps = exercise.type !== "TIMED" ? row.reps : null;
    const duration = exercise.type === "TIMED" ? row.durationSec : null;
    if (reps == null && duration == null) return;

    void (async () => {
      await startSession(scheduleId);
      await logSet({ scheduleId, ...buildLog(exercise, row, index + 1) });
    })();

    // Auto-start rest timer after each logged set, except the last row currently shown.
    const rowCount = sets[exercise.id]?.length ?? exercise.sets;
    if (index < rowCount - 1 && exercise.restTime) {
      startRestTimer(exercise.restTime);
    }
  }

  async function saveSetValues(exercise: Exercise, index: number, rpe: string) {
    const row = sets[exercise.id][index];
    if (row.reps == null && row.durationSec == null) return;
    await startSession(scheduleId);
    await logSet({ scheduleId, ...buildLog(exercise, { ...row, rpe }, index + 1) });
  }

  async function saveSetNotes(exercise: Exercise, index: number, notes: string) {
    if (!notes) return; // nothing to persist
    const row = sets[exercise.id][index];
    await startSession(scheduleId);
    await logSet({ scheduleId, ...buildLog(exercise, { ...row, notes }, index + 1) });
  }

  function addSet(exerciseId: string) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), { weight: null, reps: null, durationSec: null, rpe: "", notes: "" }],
    }));
  }

  function removeSet(exerciseId: string, index: number) {
    // Only the last row may be removed — deleting a middle row would renumber
    // the remaining rows and orphan the server-side logs for higher set numbers.
    const rows = sets[exerciseId] ?? [];
    if (index !== rows.length - 1) return;
    if (rows.length <= 1) return;
    setSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = rows.filter((_, i) => i !== index);
      return next;
    });
    void startSession(scheduleId).then(() =>
      deleteSetLog(scheduleId, exerciseId, index + 1)
    );
  }

  async function searchExtraExercises(q: string) {
    setExtraQuery(q);
    const res = await searchExerciseLibrary(q);
    setExtraResults(res);
  }

  async function addExtraExercise(libEx: (typeof extraResults)[number]) {
    // Persist a real WorkoutExercise row so ExerciseLogs can reference it via FK.
    const created = await createSessionExercise(workoutId, libEx.id);
    const newEx: Exercise = {
      id: created.id,
      name: libEx.name,
      type: libEx.type as ExerciseType,
      sets: 1,
      minReps: 1,
      maxReps: 20,
      restTime: null,
      notes: null,
      mediaUrl: null,
      scheme: null,
    };
    setExtraExercises((prev) => [...prev, newEx]);
    setSets((prev) => ({
      ...prev,
      [newEx.id]: [{ weight: null, reps: null, durationSec: null, rpe: "", notes: "" }],
    }));
    setExtraOpen(false);
    setExtraQuery("");
    setExtraResults([]);
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
    const allExercises = [...exercises, ...extraExercises];
    const logs = allExercises.flatMap((ex) =>
      (sets[ex.id] ?? [])
        .map((row, i) => {
          const reps = ex.type !== "TIMED" ? row.reps : null;
          const duration = ex.type === "TIMED" ? row.durationSec : null;
          if (reps == null && duration == null && !row.notes) return null;
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
    } else if (allExercises.length > 0) {
      await completeSession({
        scheduleId,
        workoutId,
        date,
        duration: Math.max(1, Math.round(elapsed / 60)),
        exerciseLogs: [{ exerciseId: allExercises[0].id, setNumber: 1, reps: null }],
      });
    } else {
      // No exercises at all — nothing to log, mark complete anyway.
    }

    const comparison = compareSession(sets, allExercises);
    const prsAchieved: string[] = [];
    for (const ex of allExercises) {
      const pr = prs[ex.id];
      const rows = sets[ex.id] ?? [];
      const gotPR = rows.some((row) => {
        if (ex.type === "WEIGHTED") {
          const rm = row.weight != null && row.reps != null ? epley1RM(row.weight, row.reps) : null;
          return (
            (row.weight != null && pr?.maxWeight != null && row.weight > pr.maxWeight) ||
            (rm != null && pr?.best1RM != null && rm > pr.best1RM)
          );
        }
        if (ex.type === "BODYWEIGHT") {
          return row.reps != null && pr?.maxReps != null && row.reps > pr.maxReps;
        }
        return row.durationSec != null && pr?.maxDurationSec != null && row.durationSec > pr.maxDurationSec;
      });
      if (gotPR) prsAchieved.push(ex.name);
    }
    setCompleted(true);
    setSummary(comparison);
    setPrNames(prsAchieved);
    setSaving(false);
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

      {summary && (
        <Card className="border-success/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Workout complete
            </CardTitle>
            <CardDescription>
              Completed in {formatElapsed(elapsed)} · {summary.reduce((s, x) => s + (x.onTarget ? 1 : 0), 0)}/{summary.length} exercises on target
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prNames.length > 0 && (
              <p className="mb-3 rounded-none border border-success/40 bg-success/5 px-3 py-2 text-sm font-medium text-success">
                New PRs: {prNames.join(", ")}
              </p>
            )}
            <ul className="space-y-1.5">
              {summary.map((row) => (
                <li key={row.exerciseName} className="flex items-center justify-between rounded-none border px-3 py-2 text-sm">
                  <span className="font-medium">{row.exerciseName}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {row.completedSets}/{row.targetSets} sets
                    {row.actualAvgWeight != null && ` · avg ${row.actualAvgWeight.toFixed(1)}kg`}
                    {row.actualAvgIntensity != null && ` · ${Math.round(row.actualAvgIntensity)}%`}
                    <span className={row.onTarget ? "ml-2 text-success" : "ml-2 text-mute"}>
                      {row.onTarget ? "on target" : "off target"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {restSeconds !== null && (
        <Card className={restSeconds === 0 ? "border-success/40 bg-success/5" : "border-primary/40"}>
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
                  {ex.sets} × {ex.minReps}{ex.minReps !== ex.maxReps ? `–${ex.maxReps}` : ""}
                  {ex.restTime ? ` · ${ex.restTime}s rest` : ""}
                </Badge>
              </CardTitle>
              {ex.notes && (
                <CardDescription className="text-xs">{ex.notes}</CardDescription>
              )}
              {ex.scheme?.isDeload && (
                <CardDescription className="text-xs font-medium uppercase tracking-wide text-mute">
                  Deload week — reduced sets &amp; intensity
                </CardDescription>
              )}
              {ex.scheme && (
                <CardDescription className="font-mono tabular-nums text-success">
                  Target: ~{ex.scheme.estimated1RM}kg 1RM ·{" "}
                  {ex.scheme.sets
                    ? ex.scheme.sets.reps
                        .map((r, i) => `${r}×${ex.scheme!.weights[i] ?? "—"}kg`)
                        .join(" · ")
                    : `${ex.scheme.targetReps} reps @ ${Math.round(ex.scheme.targetIntensity)}%`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {ex.type === "WEIGHTED" && ex.scheme?.weights?.[0] != null && (() => {
                const workWeight = ex.scheme!.weights[0];
                const warmups = computeWarmupSets(workWeight, 2.5);
                const load = computePlateLoad(workWeight);
                let loadLabel: string;
                if (load.barOnly) {
                  loadLabel = "just the bar";
                } else if (load.perSide.length === 0) {
                  loadLabel = `${workWeight}kg — below bar weight; use a lighter bar or dumbbells`;
                } else if (load.leftover > 0.1) {
                  loadLabel = `${load.perSide.map((p) => (p.count > 1 ? `${p.count}×${p.weight}` : `${p.weight}`)).join(" + ")} per side (+ ${load.leftover}kg odd)`;
                } else {
                  loadLabel = `${load.perSide.map((p) => (p.count > 1 ? `${p.count}×${p.weight}` : `${p.weight}`)).join(" + ")} per side`;
                }
                return (
                  <div className="mb-3 rounded-none border border-dashed border-hairline px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-mute">Warm-up</p>
                    {warmups.length > 0 && (
                      <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                        {warmups.map((w) => `${w.reps} × ${w.weight}kg`).join("  ·  ")}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                      Work set: {workWeight}kg → {loadLabel}
                    </p>
                  </div>
                );
              })()}
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
                  const pr = prs[ex.id];
                  const isPR =
                    (ex.type === "WEIGHTED" &&
                      ((row.weight != null && pr?.maxWeight != null && row.weight > pr.maxWeight) ||
                        (est1RM != null && pr?.best1RM != null && est1RM > pr.best1RM))) ||
                    (ex.type === "BODYWEIGHT" &&
                      row.reps != null && pr?.maxReps != null && row.reps > pr.maxReps) ||
                    (ex.type === "TIMED" &&
                      row.durationSec != null && pr?.maxDurationSec != null && row.durationSec > pr.maxDurationSec);
                  return (
                    <div key={i} className="contents">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {i + 1}
                        {isPR && <Badge variant="success" className="text-[10px] leading-4">PR</Badge>}
                        {i >= ex.sets && i === (sets[ex.id]?.length ?? 0) - 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(ex.id, i)}
                            className="text-mute hover:text-sale"
                            aria-label={`Remove set ${i + 1} for ${ex.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {ex.type === "TIMED" ? (
                        <NumberInput
                          value={row.durationSec}
                          onValueChange={(v) => updateNumeric(ex.id, i, "durationSec", v)}
                          onCommit={(v) => finishSet(ex, i, { durationSec: v })}
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
                          onCommit={(v) => finishSet(ex, i, { reps: v })}
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
                          onCommit={(v) => finishSet(ex, i, { weight: v })}
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
                        <div className={ex.type === "WEIGHTED" ? "col-span-4 text-right text-xs text-muted-foreground" : "col-span-3 text-right text-xs text-muted-foreground"}>
                          est. 1RM: {est1RM} kg
                        </div>
                      )}
                      <div className={ex.type === "WEIGHTED" ? "col-span-4" : "col-span-3"}>
                        <Input
                          className="h-7 text-xs"
                          placeholder="Set note (optional)"
                          value={row.notes}
                          onChange={(e) => updateSet(ex.id, i, "notes", e.target.value)}
                          onBlur={() => void saveSetNotes(ex, i, row.notes)}
                          aria-label={`${ex.name} set ${i + 1} note`}
                        />
                      </div>
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

              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => addSet(ex.id)}
                disabled={completed}
              >
                <Plus className="h-4 w-4" />
                Add set
              </Button>
            </CardContent>
        </Card>
      );
    })}

      {extraExercises.map((ex) => (
        <Card key={ex.id} className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                {ex.name}
                <Badge variant="secondary">extra</Badge>
              </span>
              <Badge variant="secondary">1+ sets</Badge>
            </CardTitle>
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

              {sets[ex.id]?.map((row, i) => (
                <div key={i} className="contents">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {i + 1}
                    {i === (sets[ex.id]?.length ?? 0) - 1 && i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSet(ex.id, i)}
                        className="text-mute hover:text-sale"
                        aria-label={`Remove set ${i + 1} for ${ex.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {ex.type === "TIMED" ? (
                    <NumberInput
                      value={row.durationSec}
                      onValueChange={(v) => updateNumeric(ex.id, i, "durationSec", v)}
                      onCommit={(v) => finishSet(ex, i, { durationSec: v })}
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
                      onCommit={(v) => finishSet(ex, i, { reps: v })}
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
                      onCommit={(v) => finishSet(ex, i, { weight: v })}
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
                  <div className={ex.type === "WEIGHTED" ? "col-span-4" : "col-span-3"}>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Set note (optional)"
                      value={row.notes}
                      onChange={(e) => updateSet(ex.id, i, "notes", e.target.value)}
                      onBlur={() => void saveSetNotes(ex, i, row.notes)}
                      aria-label={`${ex.name} set ${i + 1} note`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => addSet(ex.id)}
              disabled={completed}
            >
              <Plus className="h-4 w-4" />
              Add set
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-destructive"
              onClick={async () => {
                try {
                  await deleteExercise(ex.id);
                } catch {
                  // Exercise has logged sets — row stays in the template but is
                  // hidden from this session's UI.
                }
                setExtraExercises((prev) => prev.filter((e) => e.id !== ex.id));
                setSets((prev) => {
                  const next = { ...prev };
                  delete next[ex.id];
                  return next;
                });
              }}
              disabled={completed}
            >
              <Trash className="h-4 w-4" />
              Remove exercise
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={extraOpen} onOpenChange={setExtraOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" disabled={completed}>
            <Plus className="h-4 w-4" />
            Add exercise
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search exercise library…"
              value={extraQuery}
              onChange={(e) => void searchExtraExercises(e.target.value)}
            />
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {extraResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Type to search your exercise library.</p>
              ) : (
                extraResults.map((libEx) => (
                  <button
                    key={libEx.id}
                    type="button"
                    onClick={() => addExtraExercise(libEx)}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{libEx.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {libEx.type === "BODYWEIGHT" ? "bodyweight" : libEx.type === "TIMED" ? "timed" : "weighted"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button size="lg" onClick={completed ? () => { router.push("/"); router.refresh(); } : handleComplete} disabled={saving}>
          {saving ? "Saving…" : completed ? "Done" : "Complete Workout"}
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

