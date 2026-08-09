import { Hono } from "hono";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, notFound, parseOr400 } from "../lib/validate";

const dateStr = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

function toDate(v: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? startOfDay(new Date(`${v}T00:00:00`)) : startOfDay(new Date(v));
}

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

const app = new Hono();

// GET /foods/search?q=
app.get("/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const foods = await prisma.foodItem.findMany({
    where: { isActive: true, ...(q ? { name: { contains: q } } : {}) },
    orderBy: { name: "asc" },
    take: q ? 20 : 500,
  });
  return c.json(foods);
});

// GET /foods/log?date= — today's entries
app.get("/log", async (c) => {
  const q = c.req.query("date");
  const date = q ? toDate(q) : startOfDay(new Date());
  const checkIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    include: { foodLog: { include: { foodItem: true }, orderBy: { createdAt: "asc" } } },
  });
  return c.json({ checkInId: checkIn?.id ?? null, entries: checkIn?.foodLog ?? [] });
});

// POST /foods/log  { date, foodItemId, quantity }
app.post("/log", async (c) => {
  const schema = z.object({ date: dateStr, foodItemId: z.string(), quantity: z.number().min(0.1).max(1000) });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);

  const food = await prisma.foodItem.findUnique({ where: { id: data.foodItemId } });
  if (!food) return notFound(c, "Food not found");

  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: {},
    create: { userId: DEFAULT_USER_ID, date },
  });

  const entry = await prisma.foodLogEntry.create({
    data: {
      checkInId: checkIn.id,
      foodItemId: data.foodItemId,
      quantity: data.quantity,
      calories: Math.round(food.caloriesPerServing * data.quantity),
      protein: food.proteinPerServing * data.quantity,
      carbs: food.carbsPerServing * data.quantity,
      fat: food.fatPerServing * data.quantity,
    },
    include: { foodItem: true },
  });

  await recomputeCheckInTotals(checkIn.id);
  return c.json(entry);
});

// DELETE /foods/log/:id
app.delete("/log/:id", async (c) => {
  const id = c.req.param("id");
  const entry = await prisma.foodLogEntry.findFirst({
    where: { id, checkIn: { userId: DEFAULT_USER_ID } },
  });
  if (!entry) return notFound(c, "Entry not found");
  await prisma.foodLogEntry.delete({ where: { id: entry.id } });
  await recomputeCheckInTotals(entry.checkInId);
  return c.json({ ok: true });
});

export default app;
