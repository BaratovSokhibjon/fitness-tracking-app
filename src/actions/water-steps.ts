"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import {
  stepsUpdateSchema,
  waterIncrementSchema,
  caffeineIncrementSchema,
  type StepsUpdateInput,
  type WaterIncrementInput,
  type CaffeineIncrementInput,
} from "@/schemas/check-in";

export async function incrementWater(input: WaterIncrementInput) {
  const { date: dateStr, amount } = waterIncrementSchema.parse(input);
  const date = startOfDay(new Date(dateStr));
  const userId = DEFAULT_USER_ID;

  const existing = await prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId, date } } });
  const water = (existing?.water ?? 0) + amount;

  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId, date } },
    update: { water },
    create: { date, userId, water },
  });

  revalidatePath("/");
  revalidatePath("/history");
  return { water };
}

export async function updateSteps(input: StepsUpdateInput) {
  const { date: dateStr, steps } = stepsUpdateSchema.parse(input);
  const date = startOfDay(new Date(dateStr));
  const userId = DEFAULT_USER_ID;

  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId, date } },
    update: { steps },
    create: { date, userId, steps },
  });

  revalidatePath("/");
  revalidatePath("/history");
  return { steps };
}

export async function incrementCaffeine(input: CaffeineIncrementInput) {
  const { date: dateStr, amount } = caffeineIncrementSchema.parse(input);
  const date = startOfDay(new Date(dateStr));
  const userId = DEFAULT_USER_ID;

  const existing = await prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId, date } } });
  const caffeineMg = (existing?.caffeineMg ?? 0) + amount;

  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId, date } },
    update: { caffeineMg },
    create: { date, userId, caffeineMg },
  });

  revalidatePath("/");
  revalidatePath("/history");
  return { caffeineMg };
}
