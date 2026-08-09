"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
const creatine_1 = require("../lib/creatine");
const dateStr = zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
function toDate(v) {
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? (0, date_fns_1.startOfDay)(new Date(`${v}T00:00:00`)) : (0, date_fns_1.startOfDay)(new Date(v));
}
async function recomputeCheckInTotals(checkInId) {
    const entries = await prisma_1.prisma.foodLogEntry.findMany({ where: { checkInId } });
    const totals = entries.reduce((acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    await prisma_1.prisma.dailyCheckIn.update({
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
const opSchema = zod_1.z.discriminatedUnion("type", [
    zod_1.z.object({
        type: zod_1.z.literal("checkin"),
        date: dateStr,
        // Derived columns (calories/protein/carbs/fat) are EXCLUDED — server computes them from food log.
        morningWeight: zod_1.z.number().min(20).max(300).nullable().optional(),
        sleepHours: zod_1.z.number().min(0).max(24).nullable().optional(),
        energy: zod_1.z.number().int().min(1).max(10).nullable().optional(),
        mood: zod_1.z.number().int().min(1).max(10).nullable().optional(),
        soreness: zod_1.z.number().int().min(1).max(10).nullable().optional(),
        water: zod_1.z.number().int().min(0).max(20000).nullable().optional(),
        steps: zod_1.z.number().int().min(0).max(200000).nullable().optional(),
        caffeineMg: zod_1.z.number().int().min(0).max(2000).nullable().optional(),
        notes: zod_1.z.string().max(2000).nullable().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("food_add"),
        opId: zod_1.z.string().min(1).max(100),
        date: dateStr,
        foodItemId: zod_1.z.string(),
        quantity: zod_1.z.number().min(0.1).max(1000),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("food_remove"),
        entryId: zod_1.z.string(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("habit"),
        habitId: zod_1.z.string(),
        date: dateStr,
        completed: zod_1.z.boolean(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("creatine"),
        date: dateStr,
        taken: zod_1.z.boolean(),
    }),
]);
const syncSchema = zod_1.z.object({
    since: zod_1.z.string().datetime().nullable().optional(),
    ops: zod_1.z.array(opSchema).max(500),
});
const app = new hono_1.Hono();
// POST /sync — push idempotent ops, pull all rows changed since `since`
app.post("/", async (c) => {
    const body = (0, validate_1.parseOr400)(c, syncSchema, await c.req.json().catch(() => null));
    if (!body)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const applied = [];
    for (const op of body.ops) {
        // If the op carries a client opId, dedup: an already-seen opId is skipped.
        const opId = op.opId;
        if (opId) {
            try {
                await prisma_1.prisma.idempotencyKey.create({
                    data: { userId: prisma_1.DEFAULT_USER_ID, key: opId, opType: op.type },
                });
            }
            catch {
                applied.push(`${op.type}:duplicate`);
                continue; // already applied on a prior retry — skip.
            }
        }
        try {
            switch (op.type) {
                case "checkin": {
                    const date = toDate(op.date);
                    const { date: _d, type: _t, ...fields } = op;
                    await prisma_1.prisma.dailyCheckIn.upsert({
                        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
                        update: fields,
                        create: { userId: prisma_1.DEFAULT_USER_ID, date, ...fields },
                    });
                    applied.push("checkin");
                    break;
                }
                case "food_add": {
                    const date = toDate(op.date);
                    const food = await prisma_1.prisma.foodItem.findUnique({ where: { id: op.foodItemId } });
                    if (food) {
                        const checkIn = await prisma_1.prisma.dailyCheckIn.upsert({
                            where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
                            update: {},
                            create: { userId: prisma_1.DEFAULT_USER_ID, date },
                        });
                        await prisma_1.prisma.foodLogEntry.create({
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
                    const entry = await prisma_1.prisma.foodLogEntry.findFirst({
                        where: { id: op.entryId, checkIn: { userId: prisma_1.DEFAULT_USER_ID } },
                    });
                    if (entry) {
                        await prisma_1.prisma.foodLogEntry.delete({ where: { id: entry.id } });
                        await recomputeCheckInTotals(entry.checkInId);
                    }
                    applied.push("food_remove");
                    break;
                }
                case "habit": {
                    const date = toDate(op.date);
                    await prisma_1.prisma.habitLog.upsert({
                        where: { userId_habitId_date: { userId: prisma_1.DEFAULT_USER_ID, habitId: op.habitId, date } },
                        update: { completed: op.completed },
                        create: { userId: prisma_1.DEFAULT_USER_ID, habitId: op.habitId, date, completed: op.completed },
                    });
                    applied.push("habit");
                    break;
                }
                case "creatine": {
                    const date = toDate(op.date);
                    const existing = await prisma_1.prisma.creatineLog.findUnique({
                        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
                    });
                    if (op.taken && !existing) {
                        const config = await (0, creatine_1.getCreatineConfig)();
                        const phase = config ? (0, creatine_1.getPhase)(config, date) : { recommendedDose: 5 };
                        await prisma_1.prisma.creatineLog.create({
                            data: {
                                userId: prisma_1.DEFAULT_USER_ID,
                                date,
                                doseGrams: phase.recommendedDose,
                            },
                        });
                    }
                    else if (!op.taken && existing) {
                        await prisma_1.prisma.creatineLog.delete({ where: { id: existing.id } });
                    }
                    applied.push("creatine");
                    break;
                }
            }
        }
        catch (e) {
            // Skip a failing op but continue the batch; report it.
            applied.push(`${op.type}:error`);
        }
    }
    // ─── Pull: rows changed since `since` ──────────────────
    const since = body.since ? new Date(body.since) : new Date(0);
    const [checkIns, foodLog, habits, creatine, schedule] = await Promise.all([
        prisma_1.prisma.dailyCheckIn.findMany({
            where: { userId: prisma_1.DEFAULT_USER_ID, updatedAt: { gte: since } },
            include: { _count: { select: { foodLog: true } } },
            orderBy: { updatedAt: "asc" },
        }),
        prisma_1.prisma.foodLogEntry.findMany({
            where: { checkIn: { userId: prisma_1.DEFAULT_USER_ID, updatedAt: { gte: since } } },
            include: { foodItem: true, checkIn: { select: { date: true } } },
            orderBy: { createdAt: "asc" },
        }),
        prisma_1.prisma.habit.findMany({
            where: { isActive: true },
            include: { logs: { where: { userId: prisma_1.DEFAULT_USER_ID }, orderBy: { date: "asc" } } },
            orderBy: { sortOrder: "asc" },
        }),
        prisma_1.prisma.creatineLog.findMany({
            where: { userId: prisma_1.DEFAULT_USER_ID },
            orderBy: { date: "asc" },
        }),
        prisma_1.prisma.workoutSchedule.findMany({
            where: { userId: prisma_1.DEFAULT_USER_ID, updatedAt: { gte: since } },
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
exports.default = app;
