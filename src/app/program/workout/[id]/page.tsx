import { notFound } from "next/navigation";
import Link from "next/link";
import { getProgramList, getWorkout } from "@/queries/calendar";
import { WorkoutForm } from "@/components/program/workout-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workout, programs] = await Promise.all([getWorkout(id), getProgramList()]);
  if (!workout) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium text-ink">{workout.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/program/${workout.programId}`}>← Program</Link>
        </Button>
      </div>
      <WorkoutForm
        programs={programs}
        workout={{
          id: workout.id,
          name: workout.name,
          dayOfWeek: workout.dayOfWeek,
          programId: workout.programId,
          exercises: workout.exercises.map((e) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            name: e.exercise.name,
            sets: e.sets,
            repRange: e.repRange,
            type: e.exercise.type,
            restTime: e.restTime,
            notes: e.notes,
          })),
        }}
      />
    </div>
  );
}
