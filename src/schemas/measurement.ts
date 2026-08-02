import { z } from "zod";

export const measurementSchema = z.object({
  date: z.string().datetime(),
  weight: z.number().min(20).max(300).nullable().optional(),
  chest: z.number().min(30).max(200).nullable().optional(),
  waist: z.number().min(30).max(200).nullable().optional(),
  hips: z.number().min(30).max(200).nullable().optional(),
  neck: z.number().min(15).max(60).nullable().optional(),
  leftArm: z.number().min(10).max(80).nullable().optional(),
  rightArm: z.number().min(10).max(80).nullable().optional(),
  leftThigh: z.number().min(20).max(120).nullable().optional(),
  rightThigh: z.number().min(20).max(120).nullable().optional(),
});

export type MeasurementInput = z.infer<typeof measurementSchema>;
