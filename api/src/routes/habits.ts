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

// GET /habits?date= — habits with today's completion
app.get("/", async (c) => {
  const q = c.req.query("date");
  const date = q ? toDate(q) : startOfDay(new Date());
  const habits = await prisma.habit.findMany({
    where: { isActive: true },
    include: { logs: { where: { userId: DEFAULT_USER_ID, date } } },
    orderBy: { sortOrder: "asc" },
  });
  return c.json(
    habits.map((h) => ({
      id: h.id,
      name: h.name,
      completed: h.logs.length > 0 ? h.logs[0].completed : false,
    }))
  );
});

// POST /habits/toggle  { habitId, date, completed }
app.post("/toggle", async (c) => {
  const schema = z.object({ habitId: z.string(), date: dateStr, completed: z.boolean() });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);
  await prisma.habitLog.upsert({
    where: { userId_habitId_date: { userId: DEFAULT_USER_ID, habitId: data.habitId, date } },
    update: { completed: data.completed },
    create: { userId: DEFAULT_USER_ID, habitId: data.habitId, date, completed: data.completed },
  });
  return c.json({ ok: true });
});

export default app;
