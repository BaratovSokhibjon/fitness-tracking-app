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
// GET /habits?date= — habits with today's completion
app.get("/", async (c) => {
    const q = c.req.query("date");
    const date = q ? toDate(q) : (0, date_fns_1.startOfDay)(new Date());
    const habits = await prisma_1.prisma.habit.findMany({
        where: { isActive: true },
        include: { logs: { where: { userId: prisma_1.DEFAULT_USER_ID, date } } },
        orderBy: { sortOrder: "asc" },
    });
    return c.json(habits.map((h) => ({
        id: h.id,
        name: h.name,
        completed: h.logs.length > 0 ? h.logs[0].completed : false,
    })));
});
// POST /habits/toggle  { habitId, date, completed }
app.post("/toggle", async (c) => {
    const schema = zod_1.z.object({ habitId: zod_1.z.string(), date: dateStr, completed: zod_1.z.boolean() });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    await prisma_1.prisma.habitLog.upsert({
        where: { userId_habitId_date: { userId: prisma_1.DEFAULT_USER_ID, habitId: data.habitId, date } },
        update: { completed: data.completed },
        create: { userId: prisma_1.DEFAULT_USER_ID, habitId: data.habitId, date, completed: data.completed },
    });
    return c.json({ ok: true });
});
exports.default = app;
