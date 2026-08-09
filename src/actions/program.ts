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
