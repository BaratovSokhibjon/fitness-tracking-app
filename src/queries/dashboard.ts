import "server-only";

import { startOfDay, startOfWeek, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getPersonalRecords } from "@/queries/records";
import { getWeeklyReview } from "@/actions/review";

const WEEK_STARTS_ON = 1 as const;

function addDaysTo(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getDashboardData() {
  const today = startOfDay(new Date());
  const profile = await prisma.profile.findFirst();
  const programStart = profile?.programStartDate ?? new Date();
  const weekNumber =
    Math.max(1, Math.floor((today.getTime() - startOfDay(programStart).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);

  const [review, records, weightTrend, workoutCompliance, habitCompliance] = await Promise.all([
    getWeeklyReview(weekNumber),
    getPersonalRecords(),
    prisma.dailyCheckIn.findMany({
      where: { morningWeight: { not: null }, date: { lte: today } },
      orderBy: { date: "desc" },
      select: { date: true, morningWeight: true },
      take: 90,
    }),
    (async () => {
      const start = startOfDay(subWeeks(today, 11));
      const schedules = await prisma.workoutSchedule.findMany({
        where: { date: { gte: start, lte: today } },
      });
      const weeks: { label: string; planned: number; completed: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: WEEK_STARTS_ON });
        const weekEnd = addDaysTo(weekStart, 6);
        const inWeek = schedules.filter((s) => s.date >= weekStart && s.date <= weekEnd);
        weeks.push({
          label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          planned: inWeek.filter((s) => s.status !== "REST").length,
          completed: inWeek.filter((s) => s.status === "COMPLETED").length,
        });
      }
      return weeks;
    })(),
    (async () => {
      const start = startOfDay(subWeeks(today, 3));
      const habits = await prisma.habit.findMany({
        where: { isActive: true },
        include: {
          logs: { where: { date: { gte: start, lte: today } } },
        },
        orderBy: { sortOrder: "asc" },
      });
      return habits.map((h) => ({
        name: h.name,
        completedDays: h.logs.filter((l) => l.completed).length,
        totalDays: h.logs.length,
      }));
    })(),
  ]);

  const avgCaloriesTarget = profile?.dailyCaloriesTarget ?? null;
  const avgProteinTarget = profile?.dailyProteinTarget ?? null;

  return {
    weekNumber,
    stats: review.stats,
    records,
    weightTrend: weightTrend
      .reverse()
      .map((w) => ({ date: w.date, value: w.morningWeight })),
    workoutCompliance,
    habitCompliance,
    targets: {
      calories: avgCaloriesTarget,
      protein: avgProteinTarget,
    },
  };
}
