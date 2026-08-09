"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
const app = new hono_1.Hono();
const profileSchema = zod_1.z.object({
    age: zod_1.z.number().int().min(10).max(120).nullable().optional(),
    height: zod_1.z.number().min(50).max(300).nullable().optional(),
    programStartDate: zod_1.z.string().datetime().nullable().optional(),
    dailyCaloriesTarget: zod_1.z.number().int().min(500).max(10000).nullable().optional(),
    dailyProteinTarget: zod_1.z.number().int().min(0).max(500).nullable().optional(),
    dailyCarbsTarget: zod_1.z.number().int().min(0).max(1000).nullable().optional(),
    dailyFatTarget: zod_1.z.number().int().min(0).max(500).nullable().optional(),
    dailyWaterTarget: zod_1.z.number().int().min(0).max(10000).nullable().optional(),
    dailyStepsTarget: zod_1.z.number().int().min(0).max(100000).nullable().optional(),
    dailyCaffeineTarget: zod_1.z.number().int().min(0).max(2000).nullable().optional(),
    sleepTarget: zod_1.z.number().min(0).max(24).nullable().optional(),
});
// GET /profile — targets + program config
app.get("/", async (c) => {
    const profile = await prisma_1.prisma.profile.findUnique({ where: { userId: prisma_1.DEFAULT_USER_ID } });
    if (!profile)
        return c.json(null);
    return c.json({
        age: profile.age,
        height: profile.height,
        programStartDate: profile.programStartDate?.toISOString() ?? null,
        dailyCaloriesTarget: profile.dailyCaloriesTarget,
        dailyProteinTarget: profile.dailyProteinTarget,
        dailyCarbsTarget: profile.dailyCarbsTarget,
        dailyFatTarget: profile.dailyFatTarget,
        dailyWaterTarget: profile.dailyWaterTarget,
        dailyStepsTarget: profile.dailyStepsTarget,
        dailyCaffeineTarget: profile.dailyCaffeineTarget,
        sleepTarget: profile.sleepTarget,
        creatineEnabled: profile.creatineEnabled,
        creatineProtocol: profile.creatineProtocol,
        creatineStartDate: profile.creatineStartDate?.toISOString() ?? null,
        creatineLoadingDays: profile.creatineLoadingDays,
        creatineLoadingDose: profile.creatineLoadingDose,
        creatineMaintenanceDose: profile.creatineMaintenanceDose,
    });
});
// PUT /profile — update targets
app.put("/", async (c) => {
    const data = (0, validate_1.parseOr400)(c, profileSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const profile = await prisma_1.prisma.profile.upsert({
        where: { userId: prisma_1.DEFAULT_USER_ID },
        update: {
            ...data,
            programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
        },
        create: {
            userId: prisma_1.DEFAULT_USER_ID,
            ...data,
            programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
        },
    });
    return c.json(profile);
});
exports.default = app;
