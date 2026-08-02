import "server-only";

import { startOfMonth, endOfMonth, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getCalendarData(date: Date) {
  const start = startOfDay(startOfMonth(date));
  const end = startOfDay(endOfMonth(date));

  const schedules = await prisma.workoutSchedule.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      workout: { include: { exercises: true } },
      session: true,
    },
    orderBy: { date: "asc" },
  });

  return { schedules, month: date.getMonth(), year: date.getFullYear() };
}

export async function getProgramList() {
  return prisma.program.findMany({
    include: { _count: { select: { workouts: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProgram(programId: string) {
  return prisma.program.findUnique({
    where: { id: programId },
    include: {
      workouts: {
        include: { exercises: { orderBy: { sortOrder: "asc" } } },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });
}

export async function getWorkout(workoutId: string) {
  return prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: { orderBy: { sortOrder: "asc" } },
      program: true,
    },
  });
}
