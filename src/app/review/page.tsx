import { format } from "date-fns";
import { getWeeklyReview } from "@/actions/review";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";
import { WeeklySummary } from "@/components/review/weekly-summary";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const profile = await import("@/actions/profile").then((m) => m.getProfile());
  const programStart = profile?.programStartDate ?? new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.max(1, Math.floor((Date.now() - new Date(programStart).getTime()) / msPerWeek) + 1);

  const review = await getWeeklyReview(weekNumber);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Review</h1>
        <p className="text-sm text-muted-foreground">
          Week {weekNumber} · {format(review.weekStart, "MMM d")} – {format(review.weekEnd, "MMM d")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg weight</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {review.stats.avgWeight ?? "—"} <span className="text-sm font-normal text-muted-foreground">kg</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg sleep</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {review.stats.avgSleep ?? "—"} <span className="text-sm font-normal text-muted-foreground">h</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg energy / mood</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {review.stats.avgEnergy ?? "—"} / {review.stats.avgMood ?? "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between">
            <span>
              Workout completion ({review.stats.completedWorkouts}/{review.stats.totalWorkouts})
            </span>
            <Badge variant={review.stats.completionRate >= 75 ? "success" : review.stats.completionRate >= 50 ? "warning" : "secondary"}>
              {review.stats.completionRate}%
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={percent(review.stats.completedWorkouts, review.stats.totalWorkouts)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition</CardTitle>
          <CardDescription>Weekly averages</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
            <span className="text-muted-foreground">Calories</span>
            <span className="font-medium">{review.stats.avgCalories} kcal</span>
          </div>
          <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
            <span className="text-muted-foreground">Protein</span>
            <span className="font-medium">{review.stats.avgProtein} g</span>
          </div>
        </CardContent>
      </Card>

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
