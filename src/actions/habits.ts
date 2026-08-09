"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { habitSchema, habitToggleSchema, type HabitInput, type HabitToggleInput } from "@/schemas/habit";

export async function createHabit(input: HabitInput) {
  const data = habitSchema.parse(input);
  const count = await prisma.habit.count();
  const habit = await prisma.habit.create({
    data: { ...data, sortOrder: data.sortOrder ?? count },
  });
  revalidatePath("/");
  return habit;
}

export async function toggleHabit(input: HabitToggleInput) {
  const { habitId, date: dateStr, completed } = habitToggleSchema.parse(input);
  const date = startOfDay(new Date(dateStr));
  const userId = DEFAULT_USER_ID;

  await prisma.habitLog.upsert({
    where: { userId_habitId_date: { userId, habitId, date } },
    update: { completed },
    create: { userId, habitId, date, completed },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function getHabitsForDate(date: Date) {
  const day = startOfDay(date);
  const habits = await prisma.habit.findMany({
    where: { isActive: true },
    include: { logs: { where: { date: day } } },
    orderBy: { sortOrder: "asc" },
  });

  return habits.map((h) => ({
    id: h.id,
    name: h.name,
    completed: h.logs.length > 0 ? h.logs[0].completed : false,
  }));
}
