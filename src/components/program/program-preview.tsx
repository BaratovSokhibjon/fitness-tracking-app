import type { ProgressionType } from "@prisma/client";
import { computeProgramPreview, formatPreviewCell } from "@/lib/progression";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type PreviewWorkout = {
  id: string;
  name: string;
  dayOfWeek: number;
  exercises: {
    id: string;
    name: string;
    type: string;
    sets: number;
    minReps: number;
    maxReps: number;
    startWeight: number | null;
    targetWeight: number | null;
  }[];
};

export function ProgramPreview({
  workouts,
  durationWeeks,
  progressionType,
  roundTo,
}: {
  workouts: PreviewWorkout[];
  durationWeeks: number;
  progressionType: ProgressionType;
  roundTo: number;
}) {
  if (workouts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Program Preview</h2>
        <Badge variant="secondary">
          {durationWeeks} weeks · {progressionType.toLowerCase()}
        </Badge>
      </div>

      {workouts.map((workout) => {
        const preview = computeProgramPreview(workout.exercises, {
          progressionType,
          roundTo,
          durationWeeks,
        });
        const weeks = Array.from({ length: durationWeeks }, (_, i) => i + 1);
        return (
          <Card key={workout.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {workout.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {dayNames[workout.dayOfWeek]}
                </span>
              </CardTitle>
              <CardDescription>Target weight × reps for each week.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-hairline px-2 py-1.5 text-left font-medium text-muted-foreground">Exercise</th>
                    {weeks.map((w) => (
                      <th key={w} className="border border-hairline px-2 py-1.5 text-center font-medium text-muted-foreground">
                        W{w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((ex) => (
                    <tr key={ex.id}>
                      <td className="border border-hairline px-2 py-1.5">
                        <span className="font-medium text-ink">{ex.name}</span>
                        {ex.type !== "WEIGHTED" && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {ex.type === "BODYWEIGHT" ? "bw" : "timed"}
                          </span>
                        )}
                      </td>
                      {ex.weeks.map((w) => (
                        <td key={w.week} className="border border-hairline px-2 py-1.5 text-center font-mono tabular-nums text-muted-foreground">
                          {formatPreviewCell(w)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
