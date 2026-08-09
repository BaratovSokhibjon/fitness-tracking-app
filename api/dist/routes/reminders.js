"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES = ["body_weight", "food_log", "water", "creatine", "caffeine", "habits", "sleep", "steps"];
// Fields required in payload; defaults applied in handler below.
const reminderSchema = zod_1.z.object({
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timezone: zod_1.z.string().min(1).max(64),
    days: zod_1.z.array(zod_1.z.enum(DAYS)).min(1),
    type: zod_1.z.enum(TYPES),
    enabled: zod_1.z.boolean(),
});
function serialize(reminder) {
    let days = [];
    try {
        days = JSON.parse(reminder.days);
    }
    catch {
        days = [];
    }
    return {
        id: reminder.id,
        time: reminder.time,
        timezone: reminder.timezone,
        days,
        type: reminder.type,
        enabled: reminder.enabled,
    };
}
const app = new hono_1.Hono();
// GET /reminders
app.get("/", async (c) => {
    const reminders = await prisma_1.prisma.reminder.findMany({
        where: { userId: prisma_1.DEFAULT_USER_ID },
        orderBy: [{ time: "asc" }],
    });
    return c.json(reminders.map(serialize));
});
// POST /reminders
app.post("/", async (c) => {
    const data = (0, validate_1.parseOr400)(c, reminderSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const reminder = await prisma_1.prisma.reminder.create({
        data: {
            userId: prisma_1.DEFAULT_USER_ID,
            time: data.time,
            timezone: data.timezone,
            days: JSON.stringify(data.days),
            type: data.type,
            enabled: data.enabled,
        },
    });
    return c.json(serialize(reminder));
});
// PUT /reminders/:id
app.put("/:id", async (c) => {
    const id = c.req.param("id");
    const data = (0, validate_1.parseOr400)(c, reminderSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const existing = await prisma_1.prisma.reminder.findFirst({ where: { id, userId: prisma_1.DEFAULT_USER_ID } });
    if (!existing)
        return (0, validate_1.notFound)(c, "Reminder not found");
    const reminder = await prisma_1.prisma.reminder.update({
        where: { id },
        data: {
            time: data.time,
            timezone: data.timezone,
            days: JSON.stringify(data.days),
            type: data.type,
            enabled: data.enabled,
        },
    });
    return c.json(serialize(reminder));
});
// DELETE /reminders/:id
app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await prisma_1.prisma.reminder.findFirst({ where: { id, userId: prisma_1.DEFAULT_USER_ID } });
    if (!existing)
        return (0, validate_1.notFound)(c, "Reminder not found");
    await prisma_1.prisma.reminder.delete({ where: { id } });
    return c.json({ ok: true });
});
exports.default = app;
