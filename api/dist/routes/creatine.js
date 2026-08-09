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
const app = new hono_1.Hono();
// GET /creatine — phase, day, dose, streak
app.get("/", async (c) => {
    const q = c.req.query("date");
    const date = q ? toDate(q) : (0, date_fns_1.startOfDay)(new Date());
    const config = await (0, creatine_1.getCreatineConfig)();
    if (!config || !config.enabled)
        return c.json(null);
    const [todayLog, last30Days] = await Promise.all([
        prisma_1.prisma.creatineLog.findUnique({ where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } } }),
        prisma_1.prisma.creatineLog.findMany({
            where: { userId: prisma_1.DEFAULT_USER_ID, date: { gte: (0, date_fns_1.subDays)(date, 30), lte: date } },
            select: { date: true },
        }),
    ]);
    const phase = (0, creatine_1.getPhase)(config, date);
    const logDates = new Set(last30Days.map((l) => (0, date_fns_1.startOfDay)(l.date).toISOString()));
    let streak = 0;
    let cursor = date;
    while (logDates.has((0, date_fns_1.startOfDay)(cursor).toISOString())) {
        streak += 1;
        cursor = (0, date_fns_1.subDays)(cursor, 1);
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
    const schema = zod_1.z.object({ date: dateStr });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const date = toDate(data.date);
    const existing = await prisma_1.prisma.creatineLog.findUnique({
        where: { userId_date: { userId: prisma_1.DEFAULT_USER_ID, date } },
    });
    if (existing) {
        await prisma_1.prisma.creatineLog.delete({ where: { id: existing.id } });
        return c.json({ ok: true, taken: false });
    }
    const config = await (0, creatine_1.getCreatineConfig)();
    if (!config?.enabled)
        return c.json({ ok: false, taken: false, error: "Creatine not enabled" });
    const phase = (0, creatine_1.getPhase)(config, date);
    await prisma_1.prisma.creatineLog.create({
        data: { userId: prisma_1.DEFAULT_USER_ID, date, doseGrams: phase.recommendedDose },
    });
    return c.json({ ok: true, taken: true });
});
exports.default = app;
