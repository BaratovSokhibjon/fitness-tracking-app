import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getWeeklyReview } from "@/actions/review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { WeeklySummary } from "@/components/review/weekly-summary";

export const dynamic = "force-dynamic";

export default async function ReviewWeekPage({ params }: { params: Promise<{ weekNumber: string }> }) {
  const { weekNumber: weekNumberStr } = await params;
  const weekNumber = parseInt(weekNumberStr, 10);
  if (Number.isNaN(weekNumber) || weekNumber < 1) notFound();

  const review = await getWeeklyReview(weekNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-ink">Week {weekNumber} Review</h1>
          <p className="text-sm text-muted-foreground">
            {format(review.weekStart, "MMM d")} – {format(review.weekEnd, "MMM d")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/review">← Current Review</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg weight</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {review.stats.avgWeight ?? "—"} <span className="font-normal text-muted-foreground">kg</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg sleep</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {review.stats.avgSleep ?? "—"} <span className="font-normal text-muted-foreground">h</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Workouts</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {review.stats.completedWorkouts}/{review.stats.totalWorkouts}
            <Badge variant="secondary" className="ml-2 text-sm">{review.stats.completionRate}%</Badge>
          </CardContent>
        </Card>
      </div>

      <WeeklySummary
        weekNumber={weekNumber}
        habits={review.habits}
        sessions={review.sessions.map((s) => ({
          id: s.id,
          workoutName: s.workout.name,
          date: s.date.toISOString(),
          setCount: s.exerciseLogs.length,
          duration: s.duration,
        }))}
        notes={review.checkIns[0]?.notes ?? ""}
      />
    </div>
  );
}
