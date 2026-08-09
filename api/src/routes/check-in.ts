import { Hono } from "hono";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";

const dateStr = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

const quickSchema = z.object({
  date: dateStr,
  morningWeight: z.number().min(20).max(300).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
});

const fullSchema = quickSchema.extend({
  // Derived totals (calories/protein/carbs/fat) are NOT accepted here — they are
  // server-computed from the food log (recomputeCheckInTotals).
  water: z.number().int().min(0).max(20000).nullable().optional(),
  steps: z.number().int().min(0).max(200000).nullable().optional(),
  caffeineMg: z.number().int().min(0).max(2000).nullable().optional(),
  soreness: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

function toDate(v: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return startOfDay(new Date(`${v}T00:00:00`));
  }
  return startOfDay(new Date(v));
}

const app = new Hono();

// GET /check-in?date=YYYY-MM-DD — today's check-in
app.get("/", async (c) => {
  const q = c.req.query("date");
  const date = q ? toDate(q) : startOfDay(new Date());
  const checkIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
  });
  return c.json(checkIn);
});

// POST /check-in/quick — weight, sleep, energy, mood
app.post("/quick", async (c) => {
  const data = parseOr400(c, quickSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: {
      morningWeight: data.morningWeight,
      sleepHours: data.sleepHours,
      energy: data.energy,
      mood: data.mood,
    },
    create: {
      userId: DEFAULT_USER_ID,
      date,
      morningWeight: data.morningWeight,
      sleepHours: data.sleepHours,
      energy: data.energy,
      mood: data.mood,
    },
  });
  return c.json(checkIn);
});

// POST /check-in — full check-in
app.post("/", async (c) => {
  const data = parseOr400(c, fullSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  const { date: _d, ...fields } = data;
  const checkIn = await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: fields,
    create: { userId: DEFAULT_USER_ID, date, ...fields },
  });
  return c.json(checkIn);
});

export default app;
