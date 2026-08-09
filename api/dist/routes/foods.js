"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
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
const app = new hono_1.Hono();
// GET /foods/search?q=
app.get("/search", async (c) => {
    const q = (c.req.query("q") ?? "").trim();
    const foods = await prisma_1.prisma.foodItem.findMany({
        where: { isActive: true, ...(q ? { name: { contains: q } } : {}) },
        orderBy: { name: "asc" },
        take: q ? 20 : 500,
    });
    return c.json(foods);
});
// GET /foods/log?date= — today's entries
app.get("/log", async (c) => {
    const q = c.req.query("date");
    const date = q ? toDate(q) : (0, date_fns_1.startOfDay)(new Date());
    const checkIn = await prisma_1.prisma.dailyCheckIn.findUnique({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        include: { foodLog: { include: { foodItem: true }, orderBy: { createdAt: "asc" } } },
    });
    return c.json({ checkInId: checkIn?.id ?? null, entries: checkIn?.foodLog ?? [] });
});
// POST /foods/log  { date, foodItemId, quantity }
app.post("/log", async (c) => {
    const schema = zod_1.z.object({ date: dateStr, foodItemId: zod_1.z.string(), quantity: zod_1.z.number().min(0.1).max(1000) });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const food = await prisma_1.prisma.foodItem.findUnique({ where: { id: data.foodItemId } });
    if (!food)
        return (0, validate_1.notFound)(c, "Food not found");
    const checkIn = await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: {},
        create: { userId: prisma_1.DEFAULT_USER_ID, date },
    });
    const entry = await prisma_1.prisma.foodLogEntry.create({
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
    const entry = await prisma_1.prisma.foodLogEntry.findFirst({
        where: { id, checkIn: { userId: prisma_1.DEFAULT_USER_ID } },
    });
    if (!entry)
        return (0, validate_1.notFound)(c, "Entry not found");
    await prisma_1.prisma.foodLogEntry.delete({ where: { id: entry.id } });
    await recomputeCheckInTotals(entry.checkInId);
    return c.json({ ok: true });
});
exports.default = app;
