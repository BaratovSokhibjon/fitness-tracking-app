"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { goalProgressSchema, goalSchema, type GoalInput, type GoalProgressInput } from "@/schemas/goal";

export async function createGoal(input: GoalInput) {
  const data = goalSchema.parse(input);
  const goal = await prisma.goal.create({ data });
  revalidatePath("/goals");
  return goal;
}

export async function updateGoal(id: string, input: GoalInput) {
  const data = goalSchema.parse(input);
  const goal = await prisma.goal.update({ where: { id }, data });
  revalidatePath("/goals");
  return goal;
}

export async function updateGoalProgress(input: GoalProgressInput) {
  const { goalId, currentValue } = goalProgressSchema.parse(input);
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { currentValue },
  });
  revalidatePath("/goals");
  return goal;
}

export async function deleteGoal(id: string) {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
  return { ok: true };
}

export async function getGoals() {
  return prisma.goal.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}
