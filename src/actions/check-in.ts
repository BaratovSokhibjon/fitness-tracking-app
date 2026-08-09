"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import {
  checkInSchema,
  postWorkoutSchema,
  quickCheckInSchema,
  type CheckInInput,
  type PostWorkoutInput,
  type QuickCheckInInput,
} from "@/schemas/check-in";

async function upsertCheckIn(whereDate: Date, data: object) {
  const date = startOfDay(whereDate);
  const userId = DEFAULT_USER_ID;
  return prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId, date } },
    update: data,
    create: { date, userId, ...data },
  });
}

export async function saveQuickCheckIn(input: QuickCheckInInput) {
  const data = quickCheckInSchema.parse(input);
  const date = startOfDay(new Date(data.date));

  await upsertCheckIn(
    date,
    {
      morningWeight: data.morningWeight,
      sleepHours: data.sleepHours,
      energy: data.energy,
      mood: data.mood,
    }
  );

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

export async function saveNutrition(input: CheckInInput) {
  const data = checkInSchema.parse(input);
  const date = startOfDay(new Date(data.date));

  await upsertCheckIn(
    date,
    {
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      water: data.water,
      steps: data.steps,
      notes: data.notes,
    }
  );

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

export async function savePostWorkout(input: PostWorkoutInput) {
  const data = postWorkoutSchema.parse(input);
  const date = startOfDay(new Date(data.date));

  await upsertCheckIn(
    date,
    {
      energy: data.energy,
      soreness: data.soreness,
      notes: data.notes,
    }
  );

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

export async function saveFullCheckIn(input: CheckInInput) {
  const data = checkInSchema.parse(input);
  const date = startOfDay(new Date(data.date));

  await upsertCheckIn(date, data);

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

export async function getCheckIn(date: Date) {
  return prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId: DEFAULT_USER_ID, date: startOfDay(date) } } });
}

export async function getCheckInsByDateRange(start: Date, end: Date) {
  return prisma.dailyCheckIn.findMany({
    where: {
      date: { gte: startOfDay(start), lte: startOfDay(end) },
    },
    orderBy: { date: "asc" },
  });
}
