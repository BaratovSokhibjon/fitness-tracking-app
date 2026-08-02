import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type HabitInput = z.infer<typeof habitSchema>;

export const habitToggleSchema = z.object({
  habitId: z.string().cuid(),
  date: z.string().datetime(),
  completed: z.boolean(),
});

export type HabitToggleInput = z.infer<typeof habitToggleSchema>;
