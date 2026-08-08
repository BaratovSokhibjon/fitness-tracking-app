import { differenceInCalendarDays, startOfDay } from "date-fns";

export type CreatinePhase = "LOADING" | "MAINTENANCE" | "NOT_STARTED";

export interface CreatineConfig {
  enabled: boolean;
  protocol: "LOADING" | "MAINTENANCE_ONLY";
  startDate: Date | null;
  loadingDays: number;
  loadingDose: number;
  maintenanceDose: number;
}

export interface CreatinePhaseInfo {
  phase: CreatinePhase;
  day: number;
  totalDays: number;
  recommendedDose: number;
}

export const MAINTENANCE_ONLY_SATURATION_DAYS = 28;

export function getCreatinePhase(config: CreatineConfig, today: Date): CreatinePhaseInfo {
  const now = startOfDay(today);
  const start = config.startDate ? startOfDay(config.startDate) : null;

  if (!config.enabled || !start) {
    return { phase: "NOT_STARTED", day: 0, totalDays: 0, recommendedDose: config.maintenanceDose };
  }

  const daysSinceStart = Math.max(0, differenceInCalendarDays(now, start));

  if (config.protocol === "LOADING" && daysSinceStart < config.loadingDays) {
    return {
      phase: "LOADING",
      day: daysSinceStart + 1,
      totalDays: config.loadingDays,
      recommendedDose: config.loadingDose,
    };
  }

  if (config.protocol === "LOADING") {
    return {
      phase: "MAINTENANCE",
      day: daysSinceStart - config.loadingDays + 1,
      totalDays: Number.POSITIVE_INFINITY,
      recommendedDose: config.maintenanceDose,
    };
  }

  return {
    phase: "MAINTENANCE",
    day: daysSinceStart + 1,
    totalDays: Number.POSITIVE_INFINITY,
    recommendedDose: config.maintenanceDose,
  };
}

export function getCreatineSaturationDays(protocol: "LOADING" | "MAINTENANCE_ONLY", loadingDays: number): number {
  return protocol === "LOADING" ? loadingDays : MAINTENANCE_ONLY_SATURATION_DAYS;
}