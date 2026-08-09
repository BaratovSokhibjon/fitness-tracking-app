"use server";

import { revalidatePath } from "next/cache";
import { startOfDay, addDays, addWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";

export async function generateSchedule(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId, userId: DEFAULT_USER_ID },
    include: { workouts: true },
  });
  if (!program) throw new Error("Program not found");

  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  const workouts = program.workouts;
  const today = startOfDay(new Date());
  const start = profile?.programStartDate ? startOfDay(profile.programStartDate) : today;
  const endDate = addWeeks(start, program.durationWeeks);

  let created = 0;
  let updated = 0;

  for (let d = startOfDay(start); d <= endDate; d = addDays(d, 1)) {
    const dayOfWeek = d.getDay();
    const workout = workouts.find((w) => w.dayOfWeek === dayOfWeek);
    const isPast = d < today;

    const existing = await prisma.workoutSchedule.findUnique({
      where: { userId_date: { userId: DEFAULT_USER_ID, date: d } },
    });

    if (existing) {
      // Never override past entries; only update future planned workout assignments.
      if (!isPast) {
        const updatedRow = await prisma.workoutSchedule.update({
          where: { userId_date: { userId: DEFAULT_USER_ID, date: d } },
          data: {
            workoutId: workout?.id ?? null,
            status: workout ? "PLANNED" : "REST",
          },
        });
        if (updatedRow) updated++;
      }
    } else {
      await prisma.workoutSchedule.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: d,
          workoutId: workout?.id ?? null,
          status: workout ? "PLANNED" : "REST",
        },
      });
      created++;
    }
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { created, updated };
}

export async function generateScheduleIfMissing(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId, userId: DEFAULT_USER_ID },
    include: { workouts: true },
  });
  if (!program) return { created: 0, updated: 0 };

  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  const today = startOfDay(new Date());
  const start = profile?.programStartDate ? startOfDay(profile.programStartDate) : today;
  const endDate = addWeeks(start, program.durationWeeks);
  const workouts = program.workouts;

  let created = 0;

  for (let d = startOfDay(start); d <= endDate; d = addDays(d, 1)) {
    const dayOfWeek = d.getDay();
    const workout = workouts.find((w) => w.dayOfWeek === dayOfWeek);

    const existing = await prisma.workoutSchedule.findUnique({
      where: { userId_date: { userId: DEFAULT_USER_ID, date: d } },
    });
    if (!existing) {
      await prisma.workoutSchedule.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: d,
          workoutId: workout?.id ?? null,
          status: workout ? "PLANNED" : "REST",
        },
      });
      created++;
    }
  }

  return { created, updated: 0 };
}

export async function getScheduleForDate(date: Date) {
  return prisma.workoutSchedule.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date: startOfDay(date) } },
    include: { workout: { include: { exercises: { include: { exercise: true } } } } },
  });
}

export async function getScheduleForMonth(date: Date) {
  const start = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
  const end = startOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return prisma.workoutSchedule.findMany({
    where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: end } },
    include: { workout: true },
    orderBy: { date: "asc" },
  });
}

export async function skipWorkout(scheduleId: string) {
  const schedule = await prisma.workoutSchedule.update({
    where: { id: scheduleId },
    data: { status: "SKIPPED" },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  return schedule;
}
