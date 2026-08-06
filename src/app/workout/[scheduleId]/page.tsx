import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionByScheduleId } from "@/actions/session";
import { getExerciseHistory } from "@/queries/records";
import { WorkoutSession } from "@/components/workout/workout-session";

export default async function WorkoutSessionPage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  const schedule = await getSessionByScheduleId(scheduleId);
  if (!schedule?.workout) notFound();

  const histories = await Promise.all(
    schedule.workout.exercises.map((e) => getExerciseHistory(e.id))
  );
  const historyByExercise = new Map(
    schedule.workout.exercises.map((e, i) => [e.id, histories[i]])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{schedule.workout.name}</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Today
        </Link>
      </div>
      <WorkoutSession
        scheduleId={schedule.id}
        workoutId={schedule.workout.id}
        date={schedule.date.toISOString()}
        exercises={schedule.workout.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          sets: e.sets,
          repRange: e.repRange,
          restTime: e.restTime,
          notes: e.notes,
          mediaUrl: e.mediaUrl,
        }))}
        historyByExercise={Object.fromEntries(
          historyByExercise.entries()
        )}
        existingLogs={
          schedule.session?.exerciseLogs.map((l) => ({
            exerciseId: l.exerciseId,
            setNumber: l.setNumber,
            weight: l.weight,
            reps: l.reps,
            durationSec: l.durationSec,
            rpe: l.rpe,
          })) ?? []
        }
        isCompleted={schedule.status === "COMPLETED"}
      />
    </div>
  );
}
