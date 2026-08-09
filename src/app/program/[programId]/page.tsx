import { notFound } from "next/navigation";
import Link from "next/link";
import { getProgram } from "@/queries/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramEditor } from "@/components/program/program-editor";
import { ProgramPreview } from "@/components/program/program-preview";
import { DuplicateWorkoutButton } from "@/components/program/duplicate-buttons";

export const dynamic = "force-dynamic";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function EditProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const program = await getProgram(programId);
  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium text-ink">{program.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/program">← Programs</Link>
        </Button>
      </div>

      <ProgramEditor
        program={{
          id: program.id,
          name: program.name,
          description: program.description,
          durationWeeks: program.durationWeeks,
          progressionType: program.progressionType,
          roundTo: program.roundTo,
          isActive: program.isActive,
        }}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Workouts</h2>
        {program.workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {workout.name}
                  <Badge variant="secondary">{dayNames[workout.dayOfWeek]}</Badge>
                </CardTitle>
                <CardDescription>
                  {workout.exercises.length} exercises
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-1">
                <DuplicateWorkoutButton workoutId={workout.id} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/program/workout/${workout.id}`}>Edit</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm">
                {workout.exercises.map((ex) => (
                  <li key={ex.id} className="flex justify-between text-muted-foreground">
                    <span>
                      {ex.exercise.name}
                      {ex.exercise.type !== "WEIGHTED" && (
                        <span className="ml-2 text-xs">
                          {ex.exercise.type === "BODYWEIGHT" ? "(bw)" : "(timed)"}
                        </span>
                      )}
                    </span>
                    <span>
                      {ex.sets} × {ex.minReps}{ex.minReps !== ex.maxReps ? `–${ex.maxReps}` : ""}
                      {ex.startWeight != null ? ` · ${ex.startWeight} → ${ex.targetWeight ?? "—"} kg` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        <Button asChild variant="outline">
          <Link href={`/program/workout/new?programId=${program.id}`}>+ Add Workout</Link>
        </Button>
      </div>

      <ProgramPreview
        workouts={program.workouts.map((w) => ({
          id: w.id,
          name: w.name,
          dayOfWeek: w.dayOfWeek,
          exercises: w.exercises.map((e) => ({
            id: e.id,
            name: e.exercise.name,
            type: e.exercise.type,
            sets: e.sets,
            minReps: e.minReps,
            maxReps: e.maxReps,
            startWeight: e.startWeight,
            targetWeight: e.targetWeight,
          })),
        }))}
        durationWeeks={program.durationWeeks}
        progressionType={program.progressionType}
        roundTo={program.roundTo}
      />
    </div>
  );
}
