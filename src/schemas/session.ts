import { z } from "zod";

export const exerciseLogSchema = z.object({
  exerciseId: z.string().cuid(),
  setNumber: z.number().int().min(1).max(20),
  weight: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(200).nullable().optional(),
  durationSec: z.number().int().min(0).max(3600).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type ExerciseLogInput = z.infer<typeof exerciseLogSchema>;

export const sessionSchema = z.object({
  scheduleId: z.string().cuid(),
  workoutId: z.string().cuid(),
  date: z.string().datetime(),
  duration: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  exerciseLogs: z.array(exerciseLogSchema).min(1),
});

export type SessionInput = z.infer<typeof sessionSchema>;

export const logSetSchema = z.object({
  scheduleId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  setNumber: z.number().int().min(1).max(20),
  weight: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(200).nullable().optional(),
  durationSec: z.number().int().min(0).max(3600).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
