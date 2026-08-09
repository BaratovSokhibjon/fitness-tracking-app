import { z } from "zod";

export const profileSchema = z.object({
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

export type ProfileInput = z.infer<typeof profileSchema>;
