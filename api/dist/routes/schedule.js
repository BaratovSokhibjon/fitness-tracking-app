"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const date_fns_1 = require("date-fns");
const prisma_1 = require("../lib/prisma");
const WEEK_STARTS_ON = 1;
const app = new hono_1.Hono();
// GET /schedule/today — today's workout (read-only) + weekly progress
app.get("/today", async (c) => {
    const today = (0, date_fns_1.startOfDay)(new Date());
    const weekStart = (0, date_fns_1.startOfWeek)(today, { weekStartsOn: WEEK_STARTS_ON });
    const weekEnd = (0, date_fns_1.endOfWeek)(today, { weekStartsOn: WEEK_STARTS_ON });
    const [schedule, weekSchedules] = await Promise.all([
        prisma_1.prisma.workoutSchedule.findFirst({
            where: { userId: prisma_1.DEFAULT_USER_ID, date: today },
            include: {
                workout: {
                    include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } },
                },
                session: true,
            },
        }),
        prisma_1.prisma.workoutSchedule.findMany({
            where: { userId: prisma_1.DEFAULT_USER_ID, date: { gte: weekStart, lte: weekEnd } },
        }),
    ]);
    const completed = weekSchedules.filter((s) => s.status === "COMPLETED").length;
    const total = weekSchedules.filter((s) => s.status !== "REST").length;
    return c.json({
        schedule: schedule?.workout
            ? {
                id: schedule.id,
                status: schedule.status,
                session: schedule.session,
                workout: schedule.workout,
            }
            : null,
        weeklyProgress: { completed, total },
    });
});
exports.default = app;
