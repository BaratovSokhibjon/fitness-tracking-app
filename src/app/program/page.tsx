import Link from "next/link";
import { CalendarDays, Check, Dumbbell } from "lucide-react";
import { getProgramList } from "@/queries/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const programs = await getProgramList();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium uppercase tracking-wide text-ink">Program</h1>
          <p className="text-sm text-muted-foreground">Your workout templates and schedule.</p>
        </div>
        <Button asChild>
          <Link href="/program/workout/new">New Workout</Link>
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No program yet. Create a program or a workout template to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {program.isActive && (
                    <Badge variant="success" className="gap-1">
                      <Check className="h-3 w-3" /> Active
                    </Badge>
                  )}
                  {program.name}
                </CardTitle>
                <CardDescription>
                  {program.durationWeeks} weeks · {program._count.workouts} workouts
                </CardDescription>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/program/${program.id}`}>
                    <CalendarDays className="h-4 w-4" />
                    Edit Program
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/calendar">
                    <Dumbbell className="h-4 w-4" />
                    View Calendar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
