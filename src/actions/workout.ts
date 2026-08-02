"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exerciseSchema, workoutSchema, type ExerciseInput, type WorkoutInput } from "@/schemas/program";

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

export async function createExercise(input: ExerciseInput) {
  const data = exerciseSchema.parse(input);
  const exercise = await prisma.exercise.create({ data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function updateExercise(id: string, input: ExerciseInput) {
  const data = exerciseSchema.parse(input);
  const exercise = await prisma.exercise.update({ where: { id }, data });
  revalidatePath("/program");
  revalidatePath("/");
  return exercise;
}

export async function deleteExercise(id: string) {
  await prisma.exercise.delete({ where: { id } });
  revalidatePath("/program");
  revalidatePath("/");
  return { ok: true };
}
