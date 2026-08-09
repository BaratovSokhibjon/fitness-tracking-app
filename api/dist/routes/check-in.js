"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
const dateStr = zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
const quickSchema = zod_1.z.object({
    date: dateStr,
    morningWeight: zod_1.z.number().min(20).max(300).nullable().optional(),
    sleepHours: zod_1.z.number().min(0).max(24).nullable().optional(),
    energy: zod_1.z.number().int().min(1).max(10).nullable().optional(),
    mood: zod_1.z.number().int().min(1).max(10).nullable().optional(),
});
const fullSchema = quickSchema.extend({
    // Derived totals (calories/protein/carbs/fat) are NOT accepted here — they are
    // server-computed from the food log (recomputeCheckInTotals).
    water: zod_1.z.number().int().min(0).max(20000).nullable().optional(),
    steps: zod_1.z.number().int().min(0).max(200000).nullable().optional(),
    caffeineMg: zod_1.z.number().int().min(0).max(2000).nullable().optional(),
    soreness: zod_1.z.number().int().min(1).max(10).nullable().optional(),
    notes: zod_1.z.string().max(2000).nullable().optional(),
});
function toDate(v) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return (0, date_fns_1.startOfDay)(new Date(`${v}T00:00:00`));
    }
    return (0, date_fns_1.startOfDay)(new Date(v));
}
const app = new hono_1.Hono();
// GET /check-in?date=YYYY-MM-DD — today's check-in
app.get("/", async (c) => {
    const q = c.req.query("date");
    const date = q ? toDate(q) : (0, date_fns_1.startOfDay)(new Date());
    const checkIn = await prisma_1.prisma.dailyCheckIn.findUnique({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
    });
    return c.json(checkIn);
});
// POST /check-in/quick — weight, sleep, energy, mood
app.post("/quick", async (c) => {
    const data = (0, validate_1.parseOr400)(c, quickSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const checkIn = await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: {
            morningWeight: data.morningWeight,
            sleepHours: data.sleepHours,
            energy: data.energy,
            mood: data.mood,
        },
        create: {
            userId: prisma_1.DEFAULT_USER_ID,
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
    const data = (0, validate_1.parseOr400)(c, fullSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const { date: _d, ...fields } = data;
    const checkIn = await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: fields,
        create: { userId: prisma_1.DEFAULT_USER_ID, date, ...fields },
    });
    return c.json(checkIn);
});
exports.default = app;
