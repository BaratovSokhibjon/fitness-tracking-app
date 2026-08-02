import { z } from "zod";

const dateStr = z.string().datetime();

export const checkInSchema = z.object({
  date: dateStr,
  morningWeight: z.number().min(20).max(300).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  calories: z.number().int().min(0).max(20000).nullable().optional(),
  protein: z.number().int().min(0).max(1000).nullable().optional(),
  carbs: z.number().int().min(0).max(2000).nullable().optional(),
  fat: z.number().int().min(0).max(1000).nullable().optional(),
  water: z.number().int().min(0).max(20000).nullable().optional(),
  steps: z.number().int().min(0).max(200000).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
  soreness: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const quickCheckInSchema = z.object({
  date: dateStr,
  morningWeight: z.number().min(20).max(300).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
});

export type QuickCheckInInput = z.infer<typeof quickCheckInSchema>;

export const postWorkoutSchema = z.object({
  date: dateStr,
  energy: z.number().int().min(1).max(10).nullable().optional(),
  soreness: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type PostWorkoutInput = z.infer<typeof postWorkoutSchema>;

export const waterIncrementSchema = z.object({
  date: dateStr,
  amount: z.number().int().min(0).max(5000),
});

export type WaterIncrementInput = z.infer<typeof waterIncrementSchema>;

export const stepsUpdateSchema = z.object({
  date: dateStr,
  steps: z.number().int().min(0).max(200000),
});

export type StepsUpdateInput = z.infer<typeof stepsUpdateSchema>;
