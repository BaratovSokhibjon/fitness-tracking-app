import { format } from "date-fns";
import Link from "next/link";
import { getSessionHistory } from "@/actions/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

export default async function WorkoutHistoryPage() {
  const sessions = await getSessionHistory();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-medium uppercase tracking-wide text-ink">Workout History</h1>
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
    </div>
  );
}
