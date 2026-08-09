import { format } from "date-fns";
import { getDashboardData } from "@/queries/dashboard";
import { getExercise1RMTrends } from "@/queries/records";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendLineChart } from "@/components/history/trend-charts";
import { ExerciseTrends } from "@/components/progress/exercise-trends";

export const dynamic = "force-dynamic";

function formatDurationSec(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default async function DashboardPage() {
  const [data, trends] = await Promise.all([getDashboardData(), getExercise1RMTrends()]);

  const weightChart = data.weightTrend.map((w) => ({
    label: format(w.date, "MMM d"),
    value: w.value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-ink">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Week {data.weekNumber} overview and trends.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg weight</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {data.stats.avgWeight ?? "—"}
            <span className="text-sm font-normal text-muted-foreground"> kg</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg sleep</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {data.stats.avgSleep ?? "—"}
            <span className="text-sm font-normal text-muted-foreground"> h</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg calories</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {data.stats.avgCalories ?? "—"}
            {data.targets.calories != null && (
              <span className="text-sm font-normal text-muted-foreground"> / {data.targets.calories}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg protein</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold tabular-nums">
            {data.stats.avgProtein ?? "—"}
            {data.targets.protein != null && (
              <span className="text-sm font-normal text-muted-foreground"> / {data.targets.protein}g</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {data.stats.completedWorkouts}/{data.stats.totalWorkouts}
            </p>
            <Progress value={data.stats.totalWorkouts > 0 ? (data.stats.completedWorkouts / data.stats.totalWorkouts) * 100 : 0} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendLineChart
          title="Weight Trend"
          description="Last 90 days of morning weights"
          data={weightChart}
          unit=" kg"
          color="#111111"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workout Compliance</CardTitle>
            <CardDescription>Planned vs completed, last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.workoutCompliance.map((w, i) => {
              const segments = Math.max(w.planned, w.completed, 1);
              const filled = Math.min(w.completed, w.planned);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 text-muted-foreground">{w.label}</span>
                  <div className="flex h-4 flex-1 gap-0.5">
                    {Array.from({ length: segments }, (_, j) => (
                      <span
                        key={j}
                        className={j < filled ? "flex-1 bg-success" : "flex-1 bg-hairline"}
                      />
                    ))}
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                    {w.planned === 0 ? "—" : `${w.completed}/${w.planned}`}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Habit Compliance</CardTitle>
            <CardDescription>Last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {data.habitCompliance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No habits yet.</p>
            ) : (
              <div className="space-y-2">
                {data.habitCompliance.map((h) => (
                  <div key={h.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{h.name}</span>
                    <span className="font-mono tabular-nums text-ink">
                      {h.completedDays}/{h.totalDays || 28} days
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Records</CardTitle>
            <CardDescription>All-time bests</CardDescription>
          </CardHeader>
          <CardContent>
            {data.records.length === 0 ? (
              <p className="text-sm text-muted-foreground">Log some sets to see PRs here.</p>
            ) : (
              <div className="space-y-2">
                {data.records.slice(0, 6).map((r) => (
                  <div key={r.exerciseId} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="flex flex-wrap gap-1">
                      {r.type === "TIMED" ? (
                        r.maxDurationSec != null && (
                          <Badge variant="secondary">{formatDurationSec(r.maxDurationSec)}</Badge>
                        )
                      ) : (
                        <>
                          {r.bestEstimated1RM != null && r.type === "WEIGHTED" && (
                            <Badge variant="secondary">1RM {r.bestEstimated1RM} kg</Badge>
                          )}
                          {r.maxWeight != null && r.type === "WEIGHTED" && (
                            <Badge variant="outline">max {r.maxWeight} kg</Badge>
                          )}
                          {r.maxReps != null && <Badge variant="outline">reps {r.maxReps}</Badge>}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExerciseTrends trends={trends} />
    </div>
  );
}
