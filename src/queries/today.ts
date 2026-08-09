import "server-only";

import { startOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCreatinePhase } from "@/lib/creatine";

const WEEK_STARTS_ON = 1 as const;

export async function getTodayData() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });

  const [profile, todayCheckIn, todaySchedule, yesterdayCheckIn, todayHabits, weekSchedules, activeProgram] =
    await Promise.all([
      prisma.profile.findFirst(),
      prisma.dailyCheckIn.findUnique({ where: { date: today } }),
      prisma.workoutSchedule.findUnique({
        where: { date: today },
        include: {
          workout: {
            include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } },
          },
          session: true,
        },
      }),
      prisma.dailyCheckIn.findFirst({
        where: { date: { lt: today } },
        orderBy: { date: "desc" },
        select: {
          morningWeight: true,
          sleepHours: true,
          energy: true,
          mood: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
        },
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
      prisma.program.findFirst({
        where: { isActive: true },
        select: {
          workouts: {
            select: {
              exercises: {
                select: {
                  startWeight: true,
                  exercise: { select: { type: true } },
                },
              },
            },
          },
        },
      }),
    ]);

  const weeklyCompleted = weekSchedules.filter((s) => s.status === "COMPLETED").length;
  const weeklyTotal = weekSchedules.filter((s) => s.status !== "REST").length;

  const hasActiveProgram = Boolean(activeProgram);
  const hasWorkouts = Boolean(activeProgram && activeProgram.workouts.length > 0);
  const hasExercises = Boolean(
    activeProgram?.workouts.some((w) => w.exercises.length > 0)
  );
  // Weighted-exercise check: a program with no weighted exercises at all is
  // considered complete (nothing to set weights on).
  const allWeighted = activeProgram?.workouts.flatMap((w) => w.exercises).filter((e) => e.exercise.type === "WEIGHTED") ?? [];
  const hasWeightedTargets = allWeighted.length === 0 || allWeighted.some((e) => e.startWeight != null);

  const creatineEnabled = profile?.creatineEnabled ?? false;
  let creatine = null;
  if (creatineEnabled) {
    const [todayLog, last30Days] = await Promise.all([
      prisma.creatineLog.findUnique({ where: { date: today } }),
      prisma.creatineLog.findMany({
        where: { date: { gte: subDays(today, 30), lte: today } },
        select: { date: true },
      }),
    ]);

    const config = {
      enabled: creatineEnabled,
      protocol: profile?.creatineProtocol ?? "MAINTENANCE_ONLY",
      startDate: profile?.creatineStartDate ?? null,
      loadingDays: profile?.creatineLoadingDays ?? 7,
      loadingDose: profile?.creatineLoadingDose ?? 20,
      maintenanceDose: profile?.creatineMaintenanceDose ?? 5,
    };
    const phase = getCreatinePhase(config, today);

    const logDates = new Set(last30Days.map((l) => startOfDay(l.date).toISOString()));
    let streak = 0;
    let cursor = today;
    while (logDates.has(startOfDay(cursor).toISOString())) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    creatine = {
      phase: phase.phase,
      day: phase.day,
      totalDays: Number.isFinite(phase.totalDays) ? phase.totalDays : null,
      recommendedDose: phase.recommendedDose,
      takenToday: Boolean(todayLog),
      doseGramsToday: todayLog?.doseGrams ?? null,
      streak,
      loadingDays: profile?.creatineLoadingDays ?? 7,
    };
  }

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
    yesterdayCheckIn,
    todayHabits: todayHabits.map((h) => ({
      id: h.id,
      name: h.name,
      completed: h.logs.length > 0 ? h.logs[0].completed : false,
    })),
    todayWater: todayCheckIn?.water ?? 0,
    todaySteps: todayCheckIn?.steps ?? 0,
    profile,
    creatine,
    onboarding: {
      hasProfile: Boolean(profile),
      hasActiveProgram,
      hasWorkouts,
      hasExercises,
      hasWeightedTargets,
    },
  };
}
