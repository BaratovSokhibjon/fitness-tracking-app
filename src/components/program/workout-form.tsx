"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkout, updateWorkout, deleteWorkout, createExercise, deleteExercise } from "@/actions/workout";
import { getProgramList } from "@/queries/calendar";

const dayNames = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export type ExerciseType = "WEIGHTED" | "BODYWEIGHT" | "TIMED";

export type ExerciseFormData = {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  repRange: string;
  restTime: number | null;
  notes: string | null;
  mediaUrl: string | null;
};

export function WorkoutForm({
  workout,
  programs,
}: {
  workout?: {
    id: string;
    name: string;
    dayOfWeek: number;
    programId: string;
    exercises: ExerciseFormData[];
  };
  programs: Awaited<ReturnType<typeof getProgramList>>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(workout);

  const [programId, setProgramId] = useState(workout?.programId ?? searchParams.get("programId") ?? programs[0]?.id ?? "");
  const [name, setName] = useState(workout?.name ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(workout?.dayOfWeek ?? 1);
  const [exercises, setExercises] = useState<ExerciseFormData[]>(workout?.exercises ?? []);
  const [saving, setSaving] = useState(false);

  const [newExercise, setNewExercise] = useState({
    name: "",
    type: "WEIGHTED",
    sets: "3",
    repRange: "10-12",
    restTime: "",
    notes: "",
    mediaUrl: "",
  });

  async function handleSaveWorkout() {
    setSaving(true);
    if (isEdit && workout) {
      await updateWorkout(workout.id, { programId, name, dayOfWeek });
      router.refresh();
    } else {
      const created = await createWorkout({ programId, name, dayOfWeek });
      for (const ex of exercises) {
        await createExercise({
          workoutId: created.id,
          name: ex.name,
          type: ex.type,
          sets: ex.sets,
          repRange: ex.repRange,
          restTime: ex.restTime,
          notes: ex.notes,
          mediaUrl: ex.mediaUrl,
        });
      }
      router.push(`/program/${programId}`);
    }
    setSaving(false);
  }

  async function handleAddExercise() {
    if (!newExercise.name) return;
    const exerciseData = {
      name: newExercise.name,
      type: newExercise.type as "WEIGHTED" | "BODYWEIGHT" | "TIMED",
      sets: parseInt(newExercise.sets, 10) || 3,
      repRange: newExercise.repRange,
      restTime: newExercise.restTime ? parseInt(newExercise.restTime, 10) : null,
      notes: newExercise.notes || null,
      mediaUrl: newExercise.mediaUrl || null,
    };
    if (isEdit && workout) {
      await createExercise({ workoutId: workout.id, ...exerciseData });
      router.refresh();
    } else {
      setExercises((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          ...exerciseData,
        },
      ]);
    }
    setNewExercise({ name: "", type: "WEIGHTED", sets: "3", repRange: "10-12", restTime: "", notes: "", mediaUrl: "" });
  }

  async function handleDeleteWorkout() {
    if (!isEdit || !workout) return;
    if (!confirm(`Delete workout "${workout.name}"?`)) return;
    await deleteWorkout(workout.id);
    router.push(`/program/${workout.programId}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Workout" : "New Workout"}</CardTitle>
          <CardDescription>Workout name, day of week, and exercises.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workout-name">Name</Label>
              <Input id="workout-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Push, Pull, Legs…" />
            </div>
            <div className="space-y-1.5">
              <Label>Day of week</Label>
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(parseInt(v, 10))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {isEdit && (
              <Button variant="ghost" className="text-destructive" onClick={handleDeleteWorkout}>
                Delete
              </Button>
            )}
            <Button onClick={handleSaveWorkout} disabled={saving || !name || !programId}>
              {saving ? "Saving…" : isEdit ? "Save Workout" : "Create Workout"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {ex.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ex.type === "BODYWEIGHT" ? "bodyweight" : ex.type === "TIMED" ? "timed" : "weighted"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets} sets · {ex.repRange} {ex.type === "TIMED" ? "per set" : "reps"}
                      {ex.restTime ? ` · ${ex.restTime}s rest` : ""}
                    </p>
                    {ex.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{ex.notes}</p>}
                    {ex.mediaUrl && (
                      <a
                        href={ex.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-block text-xs text-primary underline-offset-2 hover:underline"
                      >
                        reference
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      if (isEdit) {
                        await deleteExercise(ex.id);
                        router.refresh();
                      } else {
                        setExercises((prev) => prev.filter((e) => e.id !== ex.id));
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_7rem_5rem_5rem_5rem_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="ex-name">Exercise</Label>
              <Input id="ex-name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} placeholder="Push-ups" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newExercise.type} onValueChange={(v) => setNewExercise({ ...newExercise, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEIGHTED">Weighted</SelectItem>
                  <SelectItem value="BODYWEIGHT">Bodyweight</SelectItem>
                  <SelectItem value="TIMED">Timed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-sets">Sets</Label>
              <Input id="ex-sets" inputMode="numeric" value={newExercise.sets} onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-reps">{newExercise.type === "TIMED" ? "Time" : "Reps"}</Label>
              <Input id="ex-reps" value={newExercise.repRange} onChange={(e) => setNewExercise({ ...newExercise, repRange: e.target.value })} placeholder={newExercise.type === "TIMED" ? "30-60s" : "10-12"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-rest">Rest (s)</Label>
              <Input id="ex-rest" inputMode="numeric" value={newExercise.restTime} onChange={(e) => setNewExercise({ ...newExercise, restTime: e.target.value })} placeholder="90" />
            </div>
            <Button onClick={handleAddExercise} disabled={!newExercise.name}>
              Add
            </Button>
          </div>

          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ex-notes">Cue / notes (optional)</Label>
              <Input
                id="ex-notes"
                value={newExercise.notes}
                onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                placeholder="Keep elbows tucked"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-media">Reference media URL (optional)</Label>
              <Input
                id="ex-media"
                type="url"
                value={newExercise.mediaUrl}
                onChange={(e) => setNewExercise({ ...newExercise, mediaUrl: e.target.value })}
                placeholder="https://youtube.com/…"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
