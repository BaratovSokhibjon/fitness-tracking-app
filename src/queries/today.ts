import "server-only";

import { startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";

const WEEK_STARTS_ON = 1 as const;

export async function getTodayData() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });

  const [profile, todayCheckIn, todaySchedule, yesterdayCheckIn, todayHabits, weekSchedules] =
    await Promise.all([
      prisma.profile.findFirst(),
      prisma.dailyCheckIn.findUnique({ where: { date: today } }),
      prisma.workoutSchedule.findUnique({
        where: { date: today },
        include: {
          workout: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
          session: true,
        },
      }),
      prisma.dailyCheckIn.findFirst({
        where: { date: { lt: today } },
        orderBy: { date: "desc" },
        select: { morningWeight: true },
      }),
      prisma.habit.findMany({
        where: { isActive: true },
        include: {
          logs: {
            where: { date: today },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.workoutSchedule.findMany({
        where: {
          date: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

  const weeklyCompleted = weekSchedules.filter((s) => s.status === "COMPLETED").length;
  const weeklyTotal = weekSchedules.filter((s) => s.status !== "REST").length;

  return {
    todaySchedule: todaySchedule?.workout
      ? {
          id: todaySchedule.id,
          status: todaySchedule.status,
          session: todaySchedule.session,
          workout: todaySchedule.workout,
        }
      : null,
    weeklyProgress: { completed: weeklyCompleted, total: weeklyTotal },
    todayCheckIn,
    yesterdayWeight: yesterdayCheckIn?.morningWeight ?? null,
    todayHabits: todayHabits.map((h) => ({
      id: h.id,
      name: h.name,
      completed: h.logs.length > 0 ? h.logs[0].completed : false,
    })),
    todayWater: todayCheckIn?.water ?? 0,
    todaySteps: todayCheckIn?.steps ?? 0,
    profile,
  };
}
