import Link from "next/link";
import { CalendarCheck2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";

type TodaySchedule = {
  id: string;
  status: string;
  session: { duration: number | null } | null;
  workout: {
    name: string;
    exercises: { name: string; sets: number; repRange: string }[];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {completedToday ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Today&apos;s Workout
            </>
          ) : (
            <>
              <CalendarCheck2 className="h-5 w-5 text-primary" />
              Today&apos;s Workout
            </>
          )}
        </CardTitle>
        <CardDescription>
          Week progress: {weeklyProgress.completed}/{weeklyProgress.total} completed
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
                  <Badge key={ex.name} variant="secondary">
                    {ex.name} {ex.sets}×{ex.repRange}
                  </Badge>
                ))}
              </div>
            </div>
            <Button asChild>
              <Link href={`/workout/${schedule.id}`}>Start Workout</Link>
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
