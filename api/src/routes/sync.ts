import { Hono } from "hono";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";
import { getPhase, getCreatineConfig } from "../lib/creatine";

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

// ─── Op schemas (idempotent) ─────────────────────────────

const opSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("checkin"),
    date: dateStr,
    // Derived columns (calories/protein/carbs/fat) are EXCLUDED — server computes them from food log.
    morningWeight: z.number().min(20).max(300).nullable().optional(),
    sleepHours: z.number().min(0).max(24).nullable().optional(),
    energy: z.number().int().min(1).max(10).nullable().optional(),
    mood: z.number().int().min(1).max(10).nullable().optional(),
    soreness: z.number().int().min(1).max(10).nullable().optional(),
    water: z.number().int().min(0).max(20000).nullable().optional(),
    steps: z.number().int().min(0).max(200000).nullable().optional(),
    caffeineMg: z.number().int().min(0).max(2000).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  }),
  z.object({
    type: z.literal("food_add"),
    opId: z.string().min(1).max(100),
    date: dateStr,
    foodItemId: z.string(),
    quantity: z.number().min(0.1).max(1000),
  }),
  z.object({
    type: z.literal("food_remove"),
    entryId: z.string(),
  }),
  z.object({
    type: z.literal("habit"),
    habitId: z.string(),
    date: dateStr,
    completed: z.boolean(),
  }),
  z.object({
    type: z.literal("creatine"),
    date: dateStr,
    taken: z.boolean(),
  }),
]);

const syncSchema = z.object({
  since: z.string().datetime().nullable().optional(),
  ops: z.array(opSchema).max(500),
});

const app = new Hono();

// POST /sync — push idempotent ops, pull all rows changed since `since`
app.post("/", async (c) => {
  const body = parseOr400(c, syncSchema, await c.req.json().catch(() => null));
  if (!body) return badRequest(c, "Invalid payload");

  const applied: string[] = [];

  for (const op of body.ops) {
    // If the op carries a client opId, dedup: an already-seen opId is skipped.
    const opId = (op as { opId?: string }).opId;
    if (opId) {
      try {
        await prisma.idempotencyKey.create({
          data: { userId: DEFAULT_USER_ID, key: opId, opType: op.type },
        });
      } catch {
        applied.push(`${op.type}:duplicate`);
        continue; // already applied on a prior retry — skip.
      }
    }
    try {
      switch (op.type) {
        case "checkin": {
          const date = toDate(op.date);
          const { date: _d, type: _t, ...fields } = op;
          await prisma.dailyCheckIn.upsert({
            where: { userId_date: { userId: DEFAULT_USER_ID, date } },
            update: fields,
            create: { userId: DEFAULT_USER_ID, date, ...fields },
          });
          applied.push("checkin");
          break;
        }
        case "food_add": {
          const date = toDate(op.date);
          const food = await prisma.foodItem.findUnique({ where: { id: op.foodItemId } });
          if (food) {
            const checkIn = await prisma.dailyCheckIn.upsert({
              where: { userId_date: { userId: DEFAULT_USER_ID, date } },
              update: {},
              create: { userId: DEFAULT_USER_ID, date },
            });
            await prisma.foodLogEntry.create({
              data: {
                checkInId: checkIn.id,
                foodItemId: op.foodItemId,
                quantity: op.quantity,
                calories: Math.round(food.caloriesPerServing * op.quantity),
                protein: food.proteinPerServing * op.quantity,
                carbs: food.carbsPerServing * op.quantity,
                fat: food.fatPerServing * op.quantity,
              },
            });
            await recomputeCheckInTotals(checkIn.id);
          }
          applied.push("food_add");
          break;
        }
        case "food_remove": {
          const entry = await prisma.foodLogEntry.findFirst({
            where: { id: op.entryId, checkIn: { userId: DEFAULT_USER_ID } },
          });
          if (entry) {
            await prisma.foodLogEntry.delete({ where: { id: entry.id } });
            await recomputeCheckInTotals(entry.checkInId);
          }
          applied.push("food_remove");
          break;
        }
        case "habit": {
          const date = toDate(op.date);
          await prisma.habitLog.upsert({
            where: { userId_habitId_date: { userId: DEFAULT_USER_ID, habitId: op.habitId, date } },
            update: { completed: op.completed },
            create: { userId: DEFAULT_USER_ID, habitId: op.habitId, date, completed: op.completed },
          });
          applied.push("habit");
          break;
        }
        case "creatine": {
          const date = toDate(op.date);
          const existing = await prisma.creatineLog.findUnique({
            where: { userId_date: { userId: DEFAULT_USER_ID, date } },
          });
          if (op.taken && !existing) {
            const config = await getCreatineConfig();
            const phase = config ? getPhase(config, date) : { recommendedDose: 5 };
            await prisma.creatineLog.create({
              data: {
                userId: DEFAULT_USER_ID,
                date,
                doseGrams: phase.recommendedDose,
              },
            });
          } else if (!op.taken && existing) {
            await prisma.creatineLog.delete({ where: { id: existing.id } });
          }
          applied.push("creatine");
          break;
        }
      }
    } catch (e) {
      // Skip a failing op but continue the batch; report it.
      applied.push(`${op.type}:error`);
    }
  }

  // ─── Pull: rows changed since `since` ──────────────────
  const since = body.since ? new Date(body.since) : new Date(0);
  const [checkIns, foodLog, habits, creatine, schedule] = await Promise.all([
    prisma.dailyCheckIn.findMany({
      where: { userId: DEFAULT_USER_ID, updatedAt: { gte: since } },
      include: { _count: { select: { foodLog: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.foodLogEntry.findMany({
      where: { checkIn: { userId: DEFAULT_USER_ID, updatedAt: { gte: since } } },
      include: { foodItem: true, checkIn: { select: { date: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.habit.findMany({
      where: { isActive: true },
      include: { logs: { where: { userId: DEFAULT_USER_ID }, orderBy: { date: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.creatineLog.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { date: "asc" },
    }),
    prisma.workoutSchedule.findMany({
      where: { userId: DEFAULT_USER_ID, updatedAt: { gte: since } },
      include: { workout: { include: { exercises: { include: { exercise: true } } } }, session: true },
      orderBy: { date: "asc" },
    }),
  ]);

  return c.json({
    applied: applied.filter((a) => !a.endsWith(":error") && !a.endsWith(":duplicate")).length,
    errors: applied.filter((a) => a.endsWith(":error")).length,
    duplicates: applied.filter((a) => a.endsWith(":duplicate")).length,
    serverTime: new Date().toISOString(),
    data: {
      checkIns: checkIns.map((ci) => ({
        date: ci.date.toISOString(),
        morningWeight: ci.morningWeight,
        sleepHours: ci.sleepHours,
        energy: ci.energy,
        mood: ci.mood,
        soreness: ci.soreness,
        water: ci.water,
        steps: ci.steps,
        caffeineMg: ci.caffeineMg,
        calories: ci.calories,
        protein: ci.protein,
        carbs: ci.carbs,
        fat: ci.fat,
        notes: ci.notes,
        foodCount: ci._count.foodLog,
        updatedAt: ci.updatedAt.toISOString(),
      })),
      foodLog: foodLog.map((f) => ({
        id: f.id,
        date: f.checkIn.date.toISOString(),
        foodItemId: f.foodItemId,
        quantity: f.quantity,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        foodItem: f.foodItem,
        createdAt: f.createdAt.toISOString(),
      })),
      habits: habits.map((h) => ({
        id: h.id,
        name: h.name,
        completed: h.logs.filter((l) => l.completed).length > 0,
        logDates: h.logs.map((l) => ({ date: l.date.toISOString(), completed: l.completed })),
      })),
      creatine: creatine.map((cl) => ({ date: cl.date.toISOString(), doseGrams: cl.doseGrams })),
      schedule: schedule.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        status: s.status,
        workout: s.workout,
        session: s.session,
        updatedAt: s.updatedAt.toISOString(),
      })),
    },
  });
});

export default app;
