import "server-only";

import { startOfDay, startOfWeek, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
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
  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  const programStart = profile?.programStartDate ?? new Date();
  const weekNumber =
    Math.max(1, Math.floor((today.getTime() - startOfDay(programStart).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);

  const [review, records, weightTrend, workoutCompliance, habitCompliance, volumeTrend, correlations] = await Promise.all([
    getWeeklyReview(weekNumber),
    getPersonalRecords(),
    prisma.dailyCheckIn.findMany({
      where: { userId: DEFAULT_USER_ID, morningWeight: { not: null }, date: { lte: today } },
      orderBy: { date: "desc" },
      select: { date: true, morningWeight: true },
      take: 90,
    }),
    (async () => {
      const start = startOfDay(subWeeks(today, 11));
      const schedules = await prisma.workoutSchedule.findMany({
        where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: today } },
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
          logs: { where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: today } } },
        },
        orderBy: { sortOrder: "asc" },
      });
      return habits.map((h) => ({
        name: h.name,
        completedDays: h.logs.filter((l) => l.completed).length,
        totalDays: h.logs.length,
      }));
    })(),
    (async () => {
      const start = startOfDay(subWeeks(today, 11));
      const logs = await prisma.exerciseLog.findMany({
        where: {
          userId: DEFAULT_USER_ID,
          weight: { not: null },
          reps: { not: null },
          session: { date: { gte: start, lte: today } },
        },
        include: { session: { select: { date: true } } },
        orderBy: { session: { date: "asc" } },
      });
      const weeks: { label: string; tonnage: number; totalReps: number; avgIntensity: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: WEEK_STARTS_ON });
        const weekEnd = addDaysTo(weekStart, 6);
        const inWeek = logs.filter((l) => l.session.date >= weekStart && l.session.date <= weekEnd);
        const tonnage = inWeek.reduce((s, l) => s + (l.weight ?? 0) * (l.reps ?? 0), 0);
        const totalReps = inWeek.reduce((s, l) => s + (l.reps ?? 0), 0);
        // Average intensity as % of estimated 1RM (Epley) per logged set.
        let avgIntensity = 0;
        if (inWeek.length > 0) {
          const intensities = inWeek
            .map((l) => {
              const rm = l.weight! * (1 + l.reps! / 30);
              return rm > 0 ? (l.weight! / rm) * 100 : null;
            })
            .filter((x): x is number => x != null);
          avgIntensity = intensities.length > 0 ? Math.round(intensities.reduce((s, x) => s + x, 0) / intensities.length) : 0;
        }
        weeks.push({
          label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tonnage: Math.round(tonnage),
          totalReps,
          avgIntensity,
        });
      }
      return weeks;
    })(),
    (async () => {
      const checkIns = await prisma.dailyCheckIn.findMany({
        where: { userId: DEFAULT_USER_ID, date: { lte: today } },
        orderBy: { date: "asc" },
        select: { date: true, sleepHours: true, calories: true, energy: true },
        take: 90,
      });
      return checkIns.map((c) => ({
        date: c.date,
        sleepHours: c.sleepHours,
        calories: c.calories,
        energy: c.energy,
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
    volumeTrend,
    correlations,
    targets: {
      calories: avgCaloriesTarget,
      protein: avgProteinTarget,
    },
  };
}
