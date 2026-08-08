import Link from "next/link";
import { CalendarCheck, CheckCircle } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";

type TodaySchedule = {
  id: string;
  status: string;
  session: { duration: number | null; startedAt: Date | null } | null;
  workout: {
    name: string;
    exercises: { exercise: { name: string }; sets: number; minReps: number; maxReps: number }[];
  };
} | null;

export function WorkoutCard({
  schedule,
  weeklyProgress,
}: {
  schedule: TodaySchedule;
  weeklyProgress: { completed: number; total: number };
}) {
  const completedToday = schedule?.status === "COMPLETED";
  const inProgressToday = !completedToday && Boolean(schedule?.session?.startedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {completedToday ? (
            <>
              <CheckCircle className="h-5 w-5 text-success-bright" />
              Today&apos;s Workout
            </>
          ) : (
            <>
              <CalendarCheck className="h-5 w-5 text-primary" />
              Today&apos;s Workout
            </>
          )}
        </CardTitle>
        <CardDescription>
          {inProgressToday
            ? "Workout in progress"
            : `Week progress: ${weeklyProgress.completed}/${weeklyProgress.total} completed`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!schedule ? (
          <p className="text-sm text-muted-foreground">Rest day &mdash; no workout scheduled today.</p>
        ) : completedToday ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{schedule.workout.name}</p>
                <p className="text-sm text-muted-foreground">
                  Completed in {schedule.session?.duration ? `${schedule.session.duration} min` : "recorded time"}
                </p>
              </div>
              <Badge variant="success">Done</Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{schedule.workout.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {schedule.workout.exercises.map((ex) => (
                  <Badge key={ex.exercise.name} variant="secondary">
                    {ex.exercise.name} {ex.sets}×{ex.minReps}{ex.minReps !== ex.maxReps ? `-${ex.maxReps}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
            <Button asChild>
              <Link href={`/workout/${schedule.id}`}>
                {inProgressToday ? "Resume Workout" : "Start Workout"}
              </Link>
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <Progress value={percent(weeklyProgress.completed, weeklyProgress.total)} />
          <p className="text-xs text-muted-foreground">
            {weeklyProgress.completed} of {weeklyProgress.total} workouts done this week
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
