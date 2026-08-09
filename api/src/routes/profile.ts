import { Hono } from "hono";
import { z } from "zod";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";

const app = new Hono();

const profileSchema = z.object({
  age: z.number().int().min(10).max(120).nullable().optional(),
  height: z.number().min(50).max(300).nullable().optional(),
  programStartDate: z.string().datetime().nullable().optional(),
  dailyCaloriesTarget: z.number().int().min(500).max(10000).nullable().optional(),
  dailyProteinTarget: z.number().int().min(0).max(500).nullable().optional(),
  dailyCarbsTarget: z.number().int().min(0).max(1000).nullable().optional(),
  dailyFatTarget: z.number().int().min(0).max(500).nullable().optional(),
  dailyWaterTarget: z.number().int().min(0).max(10000).nullable().optional(),
  dailyStepsTarget: z.number().int().min(0).max(100000).nullable().optional(),
  dailyCaffeineTarget: z.number().int().min(0).max(2000).nullable().optional(),
  sleepTarget: z.number().min(0).max(24).nullable().optional(),
});

// GET /profile — targets + program config
app.get("/", async (c) => {
  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  if (!profile) return c.json(null);
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
  const data = parseOr400(c, profileSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const profile = await prisma.profile.upsert({
    where: { userId: DEFAULT_USER_ID },
    update: {
      ...data,
      programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
    },
    create: {
      userId: DEFAULT_USER_ID,
      ...data,
      programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
    },
  });
  return c.json(profile);
});

export default app;
