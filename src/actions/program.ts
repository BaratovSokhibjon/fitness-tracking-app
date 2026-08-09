"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { programSchema, type ProgramInput } from "@/schemas/program";
import { generateSchedule } from "@/actions/schedule";

export async function createProgram(input: ProgramInput) {
  const data = programSchema.parse(input);
  const program = await prisma.program.create({ data });
  revalidatePath("/program");
  return program;
}

export async function updateProgram(id: string, input: ProgramInput) {
  const data = programSchema.parse(input);
  const program = await prisma.program.update({ where: { id }, data });
  revalidatePath("/program");
  revalidatePath(`/program/${id}`);
  return program;
}

export async function activateProgram(id: string) {
  await prisma.$transaction([
    prisma.program.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.program.update({ where: { id }, data: { isActive: true } }),
  ]);

  const profile = await prisma.profile.findFirst();
  if (profile && !profile.programStartDate) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { programStartDate: startOfDay(new Date()) },
    });
  }

  const schedule = await generateSchedule(id);

  revalidatePath("/program");
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true, ...schedule };
}

export async function deleteProgram(id: string) {
  await prisma.program.delete({ where: { id } });
  revalidatePath("/program");
  return { ok: true };
}

export async function duplicateProgram(id: string) {
  const source = await prisma.program.findUnique({
    where: { id },
    include: { workouts: { include: { exercises: true } } },
  });
  if (!source) throw new Error("Program not found");

  const program = await prisma.program.create({
    data: {
      name: `${source.name} (copy)`,
      description: source.description,
      durationWeeks: source.durationWeeks,
      progressionType: source.progressionType,
      roundTo: source.roundTo,
      workouts: {
        create: source.workouts.map((w) => ({
          name: w.name,
          dayOfWeek: w.dayOfWeek,
          notes: w.notes,
          sortOrder: w.sortOrder,
          exercises: {
            create: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              minReps: e.minReps,
              maxReps: e.maxReps,
              startWeight: e.startWeight,
              targetWeight: e.targetWeight,
              restTime: e.restTime,
              notes: e.notes,
              sortOrder: e.sortOrder,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/program");
  return program;
}
