"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { foodItemSchema, foodLogEntrySchema, type FoodItemInput, type FoodLogEntryInput } from "@/schemas/food";

async function recomputeCheckInTotals(checkInId: string) {
  const entries = await prisma.foodLogEntry.findMany({ where: { checkInId } });

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  await prisma.dailyCheckIn.update({
    where: { id: checkInId },
    data: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    },
  });
}

export async function createFood(input: FoodItemInput) {
  const data = foodItemSchema.parse(input);
  const food = await prisma.foodItem.create({ data });
  revalidatePath("/foods");
  return food;
}

export async function importFoodsFromJson(json: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON — could not parse the uploaded file.");
  }

  const items = Array.isArray(raw) ? raw : [raw];
  if (items.length === 0) throw new Error("The JSON file contains no food items.");

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const data = foodItemSchema.parse(item);
    const existing = await prisma.foodItem.findUnique({ where: { name: data.name } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.foodItem.create({ data });
    created++;
  }

  revalidatePath("/foods");
  return { created, skipped, total: items.length };
}

export async function exportFoodsJson() {
  const foods = await prisma.foodItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return foods.map((f) => ({
    name: f.name,
    servingSize: f.servingSize,
    servingUnit: f.servingUnit,
    caloriesPerServing: f.caloriesPerServing,
    proteinPerServing: f.proteinPerServing,
    carbsPerServing: f.carbsPerServing,
    fatPerServing: f.fatPerServing,
    category: f.category,
  }));
}

export async function updateFood(id: string, input: FoodItemInput) {
  const data = foodItemSchema.parse(input);
  const food = await prisma.foodItem.update({ where: { id }, data });
  revalidatePath("/foods");
  return food;
}

export async function deleteFood(id: string) {
  await prisma.foodItem.delete({ where: { id } });
  revalidatePath("/foods");
  return { ok: true };
}

export async function getFoods() {
  return prisma.foodItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function searchFoods(query: string) {
  if (!query.trim()) return getFoods();
  return prisma.foodItem.findMany({
    where: {
      isActive: true,
      name: { contains: query.trim() },
    },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export async function addFoodToLog(input: FoodLogEntryInput) {
  const { date: dateStr, foodItemId, quantity } = foodLogEntrySchema.parse(input);
  const date = startOfDay(new Date(dateStr));

  const food = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
  if (!food) throw new Error("Food not found");

  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: {},
    create: { date, userId: DEFAULT_USER_ID },
  });

  const entry = await prisma.foodLogEntry.create({
    data: {
      checkInId: checkIn.id,
      foodItemId,
      quantity,
      calories: Math.round(food.caloriesPerServing * quantity),
      protein: food.proteinPerServing * quantity,
      carbs: food.carbsPerServing * quantity,
      fat: food.fatPerServing * quantity,
    },
    include: { foodItem: true },
  });

  await recomputeCheckInTotals(checkIn.id);

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/review");
  return entry;
}

export async function removeFoodFromLog(entryId: string) {
  const entry = await prisma.foodLogEntry.findFirst({
    where: { id: entryId, checkIn: { userId: DEFAULT_USER_ID } },
  });
  if (!entry) return { ok: false };

  await prisma.foodLogEntry.delete({ where: { id: entryId } });
  await recomputeCheckInTotals(entry.checkInId);

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/review");
  return { ok: true };
}

export async function getFoodLogForDate(date: string) {
  const day = startOfDay(new Date(date));
  const checkIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date: day } },
    include: {
      foodLog: {
        include: { foodItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    checkInId: checkIn?.id ?? null,
    entries: checkIn?.foodLog ?? [],
  };
}

// ─── Meal Templates ──────────────────────────────────────

export async function getMealTemplates() {
  return prisma.mealTemplate.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      items: {
        include: { foodItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createMealTemplate(name: string, items: { foodItemId: string; quantity: number }[]) {
  if (!name.trim()) throw new Error("Meal name is required");
  if (items.length === 0) throw new Error("Add at least one food to the meal");

  const template = await prisma.mealTemplate.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: name.trim(),
      items: {
        create: items.map((i) => ({ foodItemId: i.foodItemId, quantity: i.quantity })),
      },
    },
    include: { items: { include: { foodItem: true } } },
  });
  return template;
}

export async function deleteMealTemplate(id: string) {
  await prisma.mealTemplate.delete({ where: { id } });
  return { ok: true };
}

export async function logMealTemplate(date: string, templateId: string) {
  const day = startOfDay(new Date(date));
  const template = await prisma.mealTemplate.findFirst({
    where: { id: templateId, userId: DEFAULT_USER_ID },
    include: { items: { include: { foodItem: true } } },
  });
  if (!template) throw new Error("Meal template not found");

  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date: day } },
    update: {},
    create: { date: day, userId: DEFAULT_USER_ID },
  });

  await prisma.$transaction(
    template.items.map((item) =>
      prisma.foodLogEntry.create({
        data: {
          checkInId: checkIn.id,
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          calories: Math.round(item.foodItem.caloriesPerServing * item.quantity),
          protein: item.foodItem.proteinPerServing * item.quantity,
          carbs: item.foodItem.carbsPerServing * item.quantity,
          fat: item.foodItem.fatPerServing * item.quantity,
        },
      })
    )
  );

  await recomputeCheckInTotals(checkIn.id);
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/review");
  return { logged: template.items.length };
}

export async function copyYesterdaysMeals(date: string) {
  const day = startOfDay(new Date(date));
  const yesterday = new Date(day);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayCheckIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date: startOfDay(yesterday) } },
    include: { foodLog: true },
  });
  if (!yesterdayCheckIn || yesterdayCheckIn.foodLog.length === 0) {
    return { logged: 0 };
  }

  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date: day } },
    update: {},
    create: { date: day, userId: DEFAULT_USER_ID },
  });

  await prisma.$transaction(
    yesterdayCheckIn.foodLog.map((entry) =>
      prisma.foodLogEntry.create({
        data: {
          checkInId: checkIn.id,
          foodItemId: entry.foodItemId,
          quantity: entry.quantity,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
        },
      })
    )
  );

  await recomputeCheckInTotals(checkIn.id);
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/review");
  return { logged: yesterdayCheckIn.foodLog.length };
}
