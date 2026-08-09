import { startOfDay, differenceInCalendarDays } from "date-fns";
import { prisma, DEFAULT_USER_ID } from "./prisma";

export function getPhase(
  config: {
    enabled: boolean;
    protocol: "LOADING" | "MAINTENANCE_ONLY";
    startDate: Date | null;
    loadingDays: number;
    loadingDose: number;
    maintenanceDose: number;
  },
  today: Date
) {
  const now = startOfDay(today);
  const start = config.startDate ? startOfDay(config.startDate) : null;
  if (!config.enabled || !start) {
    return { phase: "NOT_STARTED", day: 0, totalDays: 0, recommendedDose: config.maintenanceDose };
  }
  const daysSinceStart = Math.max(0, differenceInCalendarDays(now, start));
  if (config.protocol === "LOADING" && daysSinceStart < config.loadingDays) {
    return { phase: "LOADING", day: daysSinceStart + 1, totalDays: config.loadingDays, recommendedDose: config.loadingDose };
  }
  if (config.protocol === "LOADING") {
    return { phase: "MAINTENANCE", day: daysSinceStart - config.loadingDays + 1, totalDays: Number.POSITIVE_INFINITY, recommendedDose: config.maintenanceDose };
  }
  return { phase: "MAINTENANCE", day: daysSinceStart + 1, totalDays: Number.POSITIVE_INFINITY, recommendedDose: config.maintenanceDose };
}

export async function getCreatineConfig() {
  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
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
