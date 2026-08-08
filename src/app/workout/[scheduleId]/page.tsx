import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionByScheduleId } from "@/actions/session";
import { getExerciseHistory } from "@/queries/records";
import { WorkoutSession, type Exercise } from "@/components/workout/workout-session";
import { computeWeekScheme } from "@/lib/progression";

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

  const program = schedule.workout.program;
  const startDate = new Date(program?.createdAt ?? schedule.date);
  const weekNumber = Math.max(
    1,
    Math.ceil(
      (schedule.date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );

  const exercises: Exercise[] = schedule.workout.exercises.map((e) => {
    const scheme = computeWeekScheme(
      weekNumber,
      program?.durationWeeks ?? 8,
      {
        sets: e.sets,
        minReps: e.minReps,
        maxReps: e.maxReps,
        startWeight: e.startWeight,
        targetWeight: e.targetWeight,
      },
      {
        progressionType: program?.progressionType ?? "LINEAR",
        roundTo: program?.roundTo ?? 2.5,
        durationWeeks: program?.durationWeeks ?? 8,
      },
    );
    return {
      id: e.id,
      name: e.exercise.name,
      type: e.exercise.type,
      sets: e.sets,
      minReps: e.minReps,
      maxReps: e.maxReps,
      restTime: e.restTime,
      notes: e.notes,
      mediaUrl: e.exercise.videoUrl,
      scheme,
    };
  });

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
        exercises={exercises}
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
