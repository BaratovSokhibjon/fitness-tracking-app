import { format } from "date-fns";
import { getCalendarData } from "@/queries/calendar";
import { getProgramList } from "@/queries/calendar";
import { generateScheduleIfMissing } from "@/actions/schedule";
import { WorkoutCalendar } from "@/components/calendar/workout-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = new Date();
  const programs = await getProgramList();
  const active = programs.find((p) => p.isActive);

  if (active) {
    await generateScheduleIfMissing(active.id);
  }

  const data = await getCalendarData(today);

  const days = data.schedules.map((s) => ({
    id: s.id,
    date: format(s.date, "yyyy-MM-dd"),
    status: s.status,
    workout: s.workout
      ? {
          name: s.workout.name,
          exercises: s.workout.exercises.map((e) => ({
            name: e.exercise.name,
            sets: e.sets,
            repRange: e.repRange,
          })),
        }
      : null,
    session: s.session ? { duration: s.session.duration } : null,
  }));

  return <WorkoutCalendar initialDate={today} days={days} />;
}
