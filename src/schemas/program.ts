import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullable().optional(),
  durationWeeks: z.number().int().min(1).max(52),
  isActive: z.boolean().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;

export const workoutSchema = z.object({
  programId: z.string().cuid(),
  name: z.string().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6),
  notes: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;

export const exerciseSchema = z.object({
  workoutId: z.string().cuid(),
  name: z.string().min(1).max(100),
  type: z.enum(["WEIGHTED", "BODYWEIGHT", "TIMED"]).optional(),
  sets: z.number().int().min(1).max(20),
  repRange: z.string().min(1).max(20),
  restTime: z.number().int().min(0).max(600).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  mediaUrl: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
