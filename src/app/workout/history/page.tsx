import { format } from "date-fns";
import Link from "next/link";
import { getSessionHistory } from "@/actions/session";
import { getPersonalRecords } from "@/queries/records";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDurationSec(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default async function WorkoutHistoryPage() {
  const [sessions, records] = await Promise.all([getSessionHistory(), getPersonalRecords()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workout History</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Personal Records</h2>
        {records.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Log some sets and your best lifts will appear here automatically.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {records.map((r) => (
              <Card key={r.exerciseId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{r.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {r.date ? format(new Date(r.date), "MMM d, yyyy") : "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {r.type === "TIMED" ? (
                    <>
                      {r.maxDurationSec != null && (
                        <Badge variant="secondary">best hold: {formatDurationSec(r.maxDurationSec)}</Badge>
                      )}
                      {r.maxReps != null && <Badge variant="outline">max reps: {r.maxReps}</Badge>}
                    </>
                  ) : (
                    <>
                      {r.bestEstimated1RM != null && r.type === "WEIGHTED" && (
                        <Badge variant="secondary">est. 1RM: {r.bestEstimated1RM} kg</Badge>
                      )}
                      {r.maxWeight != null && r.type === "WEIGHTED" && (
                        <Badge variant="outline">max weight: {r.maxWeight} kg</Badge>
                      )}
                      {r.maxReps != null && (
                        <Badge variant="outline">max reps: {r.maxReps}</Badge>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Sessions</h2>
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No completed workouts yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{s.workout.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{format(s.date, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s._count.exerciseLogs} sets logged</Badge>
                    {s.duration && <Badge variant="secondary">{formatDuration(s.duration)}</Badge>}
                    <Link
                      href={`/workout/${s.scheduleId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </CardHeader>
                {s.notes && (
                  <CardContent className="pt-0 text-sm text-muted-foreground">{s.notes}</CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
