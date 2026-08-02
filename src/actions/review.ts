"use server";

import { revalidatePath } from "next/cache";
import { startOfDay, endOfWeek, startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { average, round1 } from "@/lib/utils";

const WEEK_STARTS_ON = 1 as const;

export async function getWeeklyReview(weekNumber: number) {
  const profile = await prisma.profile.findFirst();
  const programStart = profile?.programStartDate ?? new Date();

  const weekStart = startOfWeek(addDaysTo(programStart, (weekNumber - 1) * 7), { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON });

  const [checkIns, sessions, habits, schedules] = await Promise.all([
    prisma.dailyCheckIn.findMany({
      where: { date: { gte: startOfDay(weekStart), lte: startOfDay(weekEnd) } },
      orderBy: { date: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: { date: { gte: startOfDay(weekStart), lte: startOfDay(weekEnd) } },
      include: {
        workout: true,
        exerciseLogs: true,
      },
    }),
    prisma.habit.findMany({
      include: {
        logs: {
          where: { date: { gte: startOfDay(weekStart), lte: startOfDay(weekEnd) } },
        },
      },
    }),
    prisma.workoutSchedule.findMany({
      where: { date: { gte: startOfDay(weekStart), lte: startOfDay(weekEnd) } },
    }),
  ]);

  const totalWorkouts = schedules.filter((s) => s.status !== "REST").length;
  const completedWorkouts = sessions.length;

  return {
    weekNumber,
    weekStart,
    weekEnd,
    checkIns,
    sessions,
    habits: habits.map((h) => ({
      name: h.name,
      completedDays: h.logs.filter((l) => l.completed).length,
      totalDays: h.logs.length,
    })),
    stats: {
      avgWeight: round1(average(checkIns.map((c) => c.morningWeight))),
      avgSleep: round1(average(checkIns.map((c) => c.sleepHours))),
      avgEnergy: round1(average(checkIns.map((c) => c.energy))),
      avgMood: round1(average(checkIns.map((c) => c.mood))),
      avgCalories: Math.round(average(checkIns.map((c) => c.calories)) ?? 0),
      avgProtein: Math.round(average(checkIns.map((c) => c.protein)) ?? 0),
      totalWorkouts,
      completedWorkouts,
      completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0,
    },
  };
}

function addDaysTo(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function saveReviewNotes(weekNumber: number, notes: string) {
  const profile = await prisma.profile.findFirst();
  const programStart = profile?.programStartDate ?? new Date();
  const weekStart = startOfWeek(addDaysTo(programStart, (weekNumber - 1) * 7), { weekStartsOn: WEEK_STARTS_ON });

  // Notes are stored on the first check-in of the week.
  await prisma.dailyCheckIn.upsert({
    where: { date: startOfDay(weekStart) },
    update: { notes },
    create: { date: startOfDay(weekStart), notes },
  });

  revalidatePath(`/review`);
  revalidatePath(`/review/${weekNumber}`);
  return { ok: true };
}
