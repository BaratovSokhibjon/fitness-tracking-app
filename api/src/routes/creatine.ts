import { Hono } from "hono";
import { z } from "zod";
import { startOfDay, subDays } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";
import { getPhase, getCreatineConfig } from "../lib/creatine";

const dateStr = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

function toDate(v: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? startOfDay(new Date(`${v}T00:00:00`)) : startOfDay(new Date(v));
}

const app = new Hono();

// GET /creatine — phase, day, dose, streak
app.get("/", async (c) => {
  const q = c.req.query("date");
  const date = q ? toDate(q) : startOfDay(new Date());
  const config = await getCreatineConfig();
  if (!config || !config.enabled) return c.json(null);

  const [todayLog, last30Days] = await Promise.all([
    prisma.creatineLog.findUnique({ where: { userId_date: { userId: DEFAULT_USER_ID, date } } }),
    prisma.creatineLog.findMany({
      where: { userId: DEFAULT_USER_ID, date: { gte: subDays(date, 30), lte: date } },
      select: { date: true },
    }),
  ]);

  const phase = getPhase(config, date);
  const logDates = new Set(last30Days.map((l) => startOfDay(l.date).toISOString()));
  let streak = 0;
  let cursor = date;
  while (logDates.has(startOfDay(cursor).toISOString())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return c.json({
    phase: phase.phase,
    day: phase.day,
    totalDays: Number.isFinite(phase.totalDays) ? phase.totalDays : null,
    recommendedDose: phase.recommendedDose,
    takenToday: Boolean(todayLog),
    doseGramsToday: todayLog?.doseGrams ?? null,
    streak,
    loadingDays: config.loadingDays,
  });
});

// POST /creatine/toggle  { date } — toggle today's dose
app.post("/toggle", async (c) => {
  const schema = z.object({ date: dateStr });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const date = toDate(data.date);

  const existing = await prisma.creatineLog.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
  });
  if (existing) {
    await prisma.creatineLog.delete({ where: { id: existing.id } });
    return c.json({ ok: true, taken: false });
  }
  const config = await getCreatineConfig();
  if (!config?.enabled) return c.json({ ok: false, taken: false, error: "Creatine not enabled" });
  const phase = getPhase(config, date);
  await prisma.creatineLog.create({
    data: { userId: DEFAULT_USER_ID, date, doseGrams: phase.recommendedDose },
  });
  return c.json({ ok: true, taken: true });
});

export default app;
