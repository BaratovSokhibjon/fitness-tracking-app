import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).max(20),
  type: z.enum(["WEIGHT", "EXERCISE", "NUTRITION", "SLEEP", "STEPS", "OTHER"]),
  isActive: z.boolean().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const goalProgressSchema = z.object({
  goalId: z.string().cuid(),
  currentValue: z.number().min(0),
});

export type GoalProgressInput = z.infer<typeof goalProgressSchema>;
