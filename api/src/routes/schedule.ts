import { Hono } from "hono";
import { startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";

const WEEK_STARTS_ON = 1 as const;

const app = new Hono();

// GET /schedule/today — today's workout (read-only) + weekly progress
app.get("/today", async (c) => {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });

  const [schedule, weekSchedules] = await Promise.all([
    prisma.workoutSchedule.findFirst({
      where: { userId: DEFAULT_USER_ID, date: today },
      include: {
        workout: {
          include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } },
        },
        session: true,
      },
    }),
    prisma.workoutSchedule.findMany({
      where: { userId: DEFAULT_USER_ID, date: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  const completed = weekSchedules.filter((s) => s.status === "COMPLETED").length;
  const total = weekSchedules.filter((s) => s.status !== "REST").length;

  return c.json({
    schedule: schedule?.workout
      ? {
          id: schedule.id,
          status: schedule.status,
          session: schedule.session,
          workout: schedule.workout,
        }
      : null,
    weeklyProgress: { completed, total },
  });
});

export default app;
