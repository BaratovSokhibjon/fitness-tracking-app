"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  exerciseLibrarySchema,
  exerciseSchema,
  workoutSchema,
  type ExerciseInput,
  type ExerciseLibraryInput,
  type WorkoutInput,
} from "@/schemas/program";

export async function createWorkout(input: WorkoutInput) {
  const data = workoutSchema.parse(input);
  const workout = await prisma.workout.create({ data });
  revalidatePath("/program");
  revalidatePath("/");
  return workout;
}

export async function updateWorkout(id: string, input: WorkoutInput) {
  const data = workoutSchema.parse(input);
  const workout = await prisma.workout.update({ where: { id }, data });
  revalidatePath("/program");
  revalidatePath("/");
  return workout;
}

export async function deleteWorkout(id: string) {
  await prisma.workout.delete({ where: { id } });
  revalidatePath("/program");
  revalidatePath("/");
  return { ok: true };
}

// ─── Exercise Library ───────────────────────────────────

export async function createExerciseLibrary(input: ExerciseLibraryInput) {
  const data = exerciseLibrarySchema.parse(input);
  const exercise = await prisma.exerciseLibrary.create({ data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function updateExerciseLibrary(id: string, input: ExerciseLibraryInput) {
  const data = exerciseLibrarySchema.parse(input);
  const exercise = await prisma.exerciseLibrary.update({ where: { id }, data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function deleteExerciseLibrary(id: string) {
  const inUse = await prisma.workoutExercise.count({ where: { exerciseId: id } });
  if (inUse > 0) throw new Error("This exercise is used by a workout and cannot be deleted.");
  await prisma.exerciseLibrary.delete({ where: { id } });
  revalidatePath("/program");
  revalidatePath("/");
  return { ok: true };
}

export async function getExerciseLibrary() {
  return prisma.exerciseLibrary.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function searchExerciseLibrary(query: string) {
  if (!query.trim()) return getExerciseLibrary();
  return prisma.exerciseLibrary.findMany({
    where: {
      isActive: true,
      name: { contains: query.trim() },
    },
    orderBy: { name: "asc" },
    take: 20,
  });
}

// ─── Workout Exercises (template rows) ──────────────────

export async function createExercise(input: ExerciseInput) {
  const data = exerciseSchema.parse(input);
  const exercise = await prisma.workoutExercise.create({ data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function updateExercise(id: string, input: ExerciseInput) {
  const data = exerciseSchema.parse(input);
  const exercise = await prisma.workoutExercise.update({ where: { id }, data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function deleteExercise(id: string) {
  const inUse = await prisma.exerciseLog.count({ where: { exerciseId: id } });
  if (inUse > 0) throw new Error("This exercise has logged history and cannot be deleted.");
  await prisma.workoutExercise.delete({ where: { id } });
  revalidatePath("/program");
  revalidatePath("/");
  return { ok: true };
}

// Creates a real WorkoutExercise row for an unplanned exercise added mid-session,
// so ExerciseLogs can reference it via the FK. Appended at the end of the template.
export async function createSessionExercise(workoutId: string, exerciseId: string) {
  const exercise = await prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId,
      sets: 1,
      minReps: 1,
      maxReps: 20,
      sortOrder: 999,
    },
  });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}
