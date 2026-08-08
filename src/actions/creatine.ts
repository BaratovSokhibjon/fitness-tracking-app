"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCreatinePhase } from "@/lib/creatine";
import {
  toggleCreatineSchema,
  updateCreatineConfigSchema,
  type ToggleCreatineInput,
  type UpdateCreatineConfigInput,
} from "@/schemas/creatine";

const DEFAULT_PROFILE_ID = "default-profile";

export async function getCreatineConfig() {
  const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_PROFILE_ID } });
  if (!profile) return null;
  return {
    enabled: profile.creatineEnabled,
    protocol: profile.creatineProtocol,
    startDate: profile.creatineStartDate,
    loadingDays: profile.creatineLoadingDays,
    loadingDose: profile.creatineLoadingDose,
    maintenanceDose: profile.creatineMaintenanceDose,
  };
}

export async function updateCreatineConfig(input: UpdateCreatineConfigInput) {
  const data = updateCreatineConfigSchema.parse(input);
  await prisma.profile.upsert({
    where: { id: DEFAULT_PROFILE_ID },
    update: {
      creatineEnabled: data.enabled,
      creatineProtocol: data.protocol,
      creatineStartDate: data.startDate ? new Date(data.startDate) : null,
      creatineLoadingDays: data.loadingDays,
      creatineLoadingDose: data.loadingDose,
      creatineMaintenanceDose: data.maintenanceDose,
    },
    create: {
      id: DEFAULT_PROFILE_ID,
      creatineEnabled: data.enabled,
      creatineProtocol: data.protocol,
      creatineStartDate: data.startDate ? new Date(data.startDate) : null,
      creatineLoadingDays: data.loadingDays,
      creatineLoadingDose: data.loadingDose,
      creatineMaintenanceDose: data.maintenanceDose,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true };
}

export async function toggleCreatine(input: ToggleCreatineInput) {
  const { date: dateStr } = toggleCreatineSchema.parse(input);
  const date = startOfDay(new Date(dateStr));

  const existing = await prisma.creatineLog.findUnique({ where: { date } });
  if (existing) {
    await prisma.creatineLog.delete({ where: { id: existing.id } });
  } else {
    const config = await getCreatineConfig();
    if (!config?.enabled) return { ok: false, logged: false };
    const phase = getCreatinePhase(config, date);
    await prisma.creatineLog.create({
      data: { date, doseGrams: phase.recommendedDose },
    });
  }

  revalidatePath("/");
  return { ok: true };
}