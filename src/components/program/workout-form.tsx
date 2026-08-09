"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  createExercise,
  updateExercise,
  deleteExercise,
  createExerciseLibrary,
  searchExerciseLibrary,
} from "@/actions/workout";
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

export type LibraryExercise = {
  id: string;
  name: string;
  type: ExerciseType;
  muscleGroup: string | null;
  equipment: string | null;
  videoUrl: string | null;
};

export type ExerciseFormData = {
  id: string;
  exerciseId: string;
  name: string;
  type: ExerciseType;
  sets: number;
  minReps: number;
  maxReps: number;
  startWeight: number | null;
  targetWeight: number | null;
  restTime: number | null;
  notes: string | null;
};

function repLabel(type: ExerciseType, minReps: number, maxReps: number): string {
  if (minReps === maxReps) return `${minReps}${type === "TIMED" ? "s" : ""}`;
  return `${minReps}–${maxReps}${type === "TIMED" ? "s" : ""}`;
}

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

  // Add-exercise controls
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LibraryExercise[]>([]);
  const [picked, setPicked] = useState<LibraryExercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLib, setNewLib] = useState({ name: "", type: "WEIGHTED", muscleGroup: "", equipment: "" });
  const [sets, setSets] = useState("3");
  const [minReps, setMinReps] = useState("8");
  const [maxReps, setMaxReps] = useState("12");
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [restTime, setRestTime] = useState("");
  const [notes, setNotes] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSets, setEditSets] = useState("");
  const [editMinReps, setEditMinReps] = useState("");
  const [editMaxReps, setEditMaxReps] = useState("");
  const [editStartWeight, setEditStartWeight] = useState("");
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editRestTime, setEditRestTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function startEdit(ex: ExerciseFormData) {
    setEditingId(ex.id);
    setEditSets(String(ex.sets));
    setEditMinReps(String(ex.minReps));
    setEditMaxReps(String(ex.maxReps));
    setEditStartWeight(ex.startWeight != null ? String(ex.startWeight) : "");
    setEditTargetWeight(ex.targetWeight != null ? String(ex.targetWeight) : "");
    setEditRestTime(ex.restTime != null ? String(ex.restTime) : "");
    setEditNotes(ex.notes ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(ex: ExerciseFormData) {
    const payload = {
      exerciseId: ex.exerciseId,
      sets: parseInt(editSets, 10) || ex.sets,
      minReps: parseInt(editMinReps, 10) || ex.minReps,
      maxReps: parseInt(editMaxReps, 10) || ex.maxReps,
      startWeight: editStartWeight ? parseFloat(editStartWeight) : null,
      targetWeight: editTargetWeight ? parseFloat(editTargetWeight) : null,
      restTime: editRestTime ? parseInt(editRestTime, 10) : null,
      notes: editNotes || null,
    };
    if (isEdit && workout) {
      await updateExercise(ex.id, { workoutId: workout.id, ...payload });
      router.refresh();
    } else {
      setExercises((prev) =>
        prev.map((e) => (e.id === ex.id ? { ...e, ...payload } : e))
      );
    }
    cancelEdit();
  }

  async function handleSearch(q: string) {
    setQuery(q);
    setPicked(null);
    const res = await searchExerciseLibrary(q);
    setResults(res.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type as ExerciseType,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment,
      videoUrl: e.videoUrl,
    })));
  }

  async function handleCreateAndUse() {
    if (!newLib.name) return;
    const created = await createExerciseLibrary({
      name: newLib.name,
      type: newLib.type as ExerciseType,
      muscleGroup: newLib.muscleGroup || null,
      equipment: newLib.equipment || null,
    });
    setPicked({ id: created.id, name: created.name, type: created.type as ExerciseType, muscleGroup: created.muscleGroup, equipment: created.equipment, videoUrl: created.videoUrl });
    setCreating(false);
    setNewLib({ name: "", type: "WEIGHTED", muscleGroup: "", equipment: "" });
  }

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
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          minReps: ex.minReps,
          maxReps: ex.maxReps,
          startWeight: ex.startWeight,
          targetWeight: ex.targetWeight,
          restTime: ex.restTime,
          notes: ex.notes,
        });
      }
      router.push(`/program/${programId}`);
    }
    setSaving(false);
  }

  async function handleAddExercise() {
    if (!picked) return;
    const data = {
      exerciseId: picked.id,
      name: picked.name,
      type: picked.type,
      sets: parseInt(sets, 10) || 3,
      minReps: parseInt(minReps, 10) || 1,
      maxReps: parseInt(maxReps, 10) || 1,
      startWeight: startWeight ? parseFloat(startWeight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      restTime: restTime ? parseInt(restTime, 10) : null,
      notes: notes || null,
    };
    if (isEdit && workout) {
      await createExercise({ workoutId: workout.id, ...data });
      router.refresh();
    } else {
      setExercises((prev) => [...prev, { id: `temp-${Date.now()}`, ...data }]);
    }
    resetAddForm();
  }

  function resetAddForm() {
    setPicked(null);
    setQuery("");
    setResults([]);
    setSets("3");
    setMinReps("8");
    setMaxReps("12");
    setStartWeight("");
    setTargetWeight("");
    setRestTime("");
    setNotes("");
    setCreating(false);
    setNewLib({ name: "", type: "WEIGHTED", muscleGroup: "", equipment: "" });
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
          <CardDescription>Pick from your exercise library or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div key={ex.id} className="rounded-md border">
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {ex.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {ex.type === "BODYWEIGHT" ? "bodyweight" : ex.type === "TIMED" ? "timed" : "weighted"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ex.sets} sets · {repLabel(ex.type, ex.minReps, ex.maxReps)} {ex.type === "TIMED" ? "per set" : "reps"}
                        {ex.restTime ? ` · ${ex.restTime}s rest` : ""}
                        {ex.startWeight != null && ` · ${ex.startWeight} → ${ex.targetWeight ?? "—"} kg`}
                      </p>
                      {ex.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{ex.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => (editingId === ex.id ? cancelEdit() : startEdit(ex))}>
                        <PencilSimple className="h-4 w-4" />
                        <span className="sr-only">Edit {ex.name}</span>
                      </Button>
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
                  </div>
                  {editingId === ex.id && (
                    <div className="space-y-3 border-t px-3 py-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-sets-${ex.id}`}>Sets</Label>
                          <NumberInput
                            id={`edit-sets-${ex.id}`}
                            value={editSets === "" ? null : parseFloat(editSets)}
                            onValueChange={(v) => setEditSets(v == null ? "" : String(v))}
                            min={1}
                            max={20}
                            step={1}
                            decimals={0}
                            placeholder="3"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-min-${ex.id}`}>{ex.type === "TIMED" ? "Min s" : "Min reps"}</Label>
                          <NumberInput
                            id={`edit-min-${ex.id}`}
                            value={editMinReps === "" ? null : parseFloat(editMinReps)}
                            onValueChange={(v) => setEditMinReps(v == null ? "" : String(v))}
                            min={1}
                            max={200}
                            step={1}
                            decimals={0}
                            placeholder="8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-max-${ex.id}`}>{ex.type === "TIMED" ? "Max s" : "Max reps"}</Label>
                          <NumberInput
                            id={`edit-max-${ex.id}`}
                            value={editMaxReps === "" ? null : parseFloat(editMaxReps)}
                            onValueChange={(v) => setEditMaxReps(v == null ? "" : String(v))}
                            min={1}
                            max={200}
                            step={1}
                            decimals={0}
                            placeholder="12"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-rest-${ex.id}`}>Rest (s)</Label>
                          <NumberInput
                            id={`edit-rest-${ex.id}`}
                            value={editRestTime === "" ? null : parseFloat(editRestTime)}
                            onValueChange={(v) => setEditRestTime(v == null ? "" : String(v))}
                            min={0}
                            max={600}
                            step={15}
                            decimals={0}
                            placeholder="90"
                          />
                        </div>
                      </div>
                      {ex.type === "WEIGHTED" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`edit-sw-${ex.id}`}>Start weight (kg)</Label>
                            <NumberInput
                              id={`edit-sw-${ex.id}`}
                              value={editStartWeight === "" ? null : parseFloat(editStartWeight)}
                              onValueChange={(v) => setEditStartWeight(v == null ? "" : String(v))}
                              min={0}
                              max={1000}
                              step={2.5}
                              decimals={1}
                              placeholder="80"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`edit-tw-${ex.id}`}>Target weight (kg)</Label>
                            <NumberInput
                              id={`edit-tw-${ex.id}`}
                              value={editTargetWeight === "" ? null : parseFloat(editTargetWeight)}
                              onValueChange={(v) => setEditTargetWeight(v == null ? "" : String(v))}
                              min={0}
                              max={1000}
                              step={2.5}
                              decimals={1}
                              placeholder="90"
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-notes-${ex.id}`}>Cue / notes (optional)</Label>
                        <Input id={`edit-notes-${ex.id}`} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Keep elbows tucked" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(ex)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-md border p-3">
            {!picked && !creating ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="lib-search">Search exercise library</Label>
                  <Input
                    id="lib-search"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="e.g. Push-ups, Squats, Plank…"
                  />
                </div>
                {results.length > 0 && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {results.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setPicked(e)}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span className="font-medium">{e.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {e.type === "BODYWEIGHT" ? "bodyweight" : e.type === "TIMED" ? "timed" : "weighted"}
                          {e.muscleGroup ? ` · ${e.muscleGroup}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
                  + Create new exercise
                </Button>
              </>
            ) : creating ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Create exercise</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lib-name">Name</Label>
                    <Input id="lib-name" value={newLib.name} onChange={(e) => setNewLib({ ...newLib, name: e.target.value })} placeholder="Push-ups" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={newLib.type} onValueChange={(v) => setNewLib({ ...newLib, type: v })}>
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
                    <Label htmlFor="lib-muscle">Muscle group</Label>
                    <Input id="lib-muscle" value={newLib.muscleGroup} onChange={(e) => setNewLib({ ...newLib, muscleGroup: e.target.value })} placeholder="Chest" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lib-equip">Equipment</Label>
                    <Input id="lib-equip" value={newLib.equipment} onChange={(e) => setNewLib({ ...newLib, equipment: e.target.value })} placeholder="None / Backpack / Dumbbells" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateAndUse} disabled={!newLib.name}>
                    Create & use
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{picked!.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {picked!.type === "BODYWEIGHT" ? "bodyweight" : picked!.type === "TIMED" ? "timed" : "weighted"}
                    {picked!.muscleGroup ? ` · ${picked!.muscleGroup}` : ""}
                    {picked!.equipment ? ` · ${picked!.equipment}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetAddForm}>
                  Change
                </Button>
              </div>
            )}

            {picked && (
              <>
                <div className="grid gap-3 border-t pt-3 sm:grid-cols-[5rem_5rem_5rem_auto] sm:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="ex-sets">Sets</Label>
                    <NumberInput
                      id="ex-sets"
                      value={sets === "" ? null : parseFloat(sets)}
                      onValueChange={(v) => setSets(v == null ? "" : String(v))}
                      min={1}
                      max={20}
                      step={1}
                      decimals={0}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ex-min">{picked.type === "TIMED" ? "Min s" : "Min reps"}</Label>
                    <NumberInput
                      id="ex-min"
                      value={minReps === "" ? null : parseFloat(minReps)}
                      onValueChange={(v) => setMinReps(v == null ? "" : String(v))}
                      min={1}
                      max={200}
                      step={1}
                      decimals={0}
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ex-max">{picked.type === "TIMED" ? "Max s" : "Max reps"}</Label>
                    <NumberInput
                      id="ex-max"
                      value={maxReps === "" ? null : parseFloat(maxReps)}
                      onValueChange={(v) => setMaxReps(v == null ? "" : String(v))}
                      min={1}
                      max={200}
                      step={1}
                      decimals={0}
                      placeholder="12"
                    />
                  </div>
                  <Button onClick={handleAddExercise} disabled={!picked}>
                    Add
                  </Button>
                </div>
                {picked.type === "WEIGHTED" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ex-start-weight">Start weight (kg)</Label>
                      <NumberInput
                        id="ex-start-weight"
                        value={startWeight === "" ? null : parseFloat(startWeight)}
                        onValueChange={(v) => setStartWeight(v == null ? "" : String(v))}
                        min={0}
                        max={1000}
                        step={2.5}
                        decimals={1}
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ex-target-weight">Target weight (kg)</Label>
                      <NumberInput
                        id="ex-target-weight"
                        value={targetWeight === "" ? null : parseFloat(targetWeight)}
                        onValueChange={(v) => setTargetWeight(v == null ? "" : String(v))}
                        min={0}
                        max={1000}
                        step={2.5}
                        decimals={1}
                        placeholder="90"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="ex-rest">Rest (s)</Label>
                  <NumberInput
                    id="ex-rest"
                    value={restTime === "" ? null : parseFloat(restTime)}
                    onValueChange={(v) => setRestTime(v == null ? "" : String(v))}
                    min={0}
                    max={600}
                    step={15}
                    decimals={0}
                    placeholder="90"
                  />
                </div>
              </>
            )}

            <div className="grid gap-3 sm:grid-cols-1">
              <div className="space-y-1.5">
                <Label htmlFor="ex-notes">Cue / notes (optional)</Label>
                <Input
                  id="ex-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keep elbows tucked"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
