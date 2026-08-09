import { Hono } from "hono";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";

const dateStr = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

function toDate(v: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? startOfDay(new Date(`${v}T00:00:00`)) : startOfDay(new Date(v));
}

const app = new Hono();

// POST /water  { date, amount }
app.post("/water", async (c) => {
  const schema = z.object({ date: dateStr, amount: z.number().int().min(0).max(5000) });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  const existing = await prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId: DEFAULT_USER_ID, date } } });
  const water = (existing?.water ?? 0) + data.amount;
  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: { water },
    create: { userId: DEFAULT_USER_ID, date, water },
  });
  return c.json({ water });
});

// POST /steps  { date, steps }
app.post("/steps", async (c) => {
  const schema = z.object({ date: dateStr, steps: z.number().int().min(0).max(200000) });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: { steps: data.steps },
    create: { userId: DEFAULT_USER_ID, date, steps: data.steps },
  });
  return c.json({ steps: data.steps });
});

// POST /caffeine  { date, amount }
app.post("/caffeine", async (c) => {
  const schema = z.object({ date: dateStr, amount: z.number().int().min(0).max(2000) });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  const existing = await prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId: DEFAULT_USER_ID, date } } });
  const caffeineMg = (existing?.caffeineMg ?? 0) + data.amount;
  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
    update: { caffeineMg },
    create: { userId: DEFAULT_USER_ID, date, caffeineMg },
  });
  return c.json({ caffeineMg });
});

export default app;
