import { z } from "zod";

export const toggleCreatineSchema = z.object({
  date: z.string().datetime(),
});

export type ToggleCreatineInput = z.infer<typeof toggleCreatineSchema>;

export const updateCreatineConfigSchema = z.object({
  enabled: z.boolean(),
  protocol: z.enum(["LOADING", "MAINTENANCE_ONLY"]),
  startDate: z.string().datetime().nullable(),
  loadingDays: z.number().int().min(3).max(14).default(7),
  loadingDose: z.number().min(5).max(30).default(20),
  maintenanceDose: z.number().min(1).max(10).default(5),
});

export type UpdateCreatineConfigInput = z.infer<typeof updateCreatineConfigSchema>;