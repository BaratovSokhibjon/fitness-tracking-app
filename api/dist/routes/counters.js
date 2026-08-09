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
const app = new hono_1.Hono();
// POST /water  { date, amount }
app.post("/water", async (c) => {
    const schema = zod_1.z.object({ date: dateStr, amount: zod_1.z.number().int().min(0).max(5000) });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const existing = await prisma_1.prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } } });
    const water = (existing?.water ?? 0) + data.amount;
    await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: { water },
        create: { userId: prisma_1.DEFAULT_USER_ID, date, water },
    });
    return c.json({ water });
});
// POST /steps  { date, steps }
app.post("/steps", async (c) => {
    const schema = zod_1.z.object({ date: dateStr, steps: zod_1.z.number().int().min(0).max(200000) });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: { steps: data.steps },
        create: { userId: prisma_1.DEFAULT_USER_ID, date, steps: data.steps },
    });
    return c.json({ steps: data.steps });
});
// POST /caffeine  { date, amount }
app.post("/caffeine", async (c) => {
    const schema = zod_1.z.object({ date: dateStr, amount: zod_1.z.number().int().min(0).max(2000) });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const existing = await prisma_1.prisma.dailyCheckIn.findUnique({ where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } } });
    const caffeineMg = (existing?.caffeineMg ?? 0) + data.amount;
    await prisma_1.prisma.dailyCheckIn.upsert({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
        update: { caffeineMg },
        create: { userId: prisma_1.DEFAULT_USER_ID, date, caffeineMg },
    });
    return c.json({ caffeineMg });
});
exports.default = app;
