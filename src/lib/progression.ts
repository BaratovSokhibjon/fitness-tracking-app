import type { ProgressionType } from "@prisma/client";

export function repsToIntensity(reps: number, slope = -3.5, constant = 97.5, quadratic = true): number {
  const base = constant + slope * (reps - 1);
  return quadratic ? base + 0.05 * (reps - 1) ** 2 : base;
}

export function progressionDiffEq(
  week: number,
  startWeight: number,
  finalWeight: number,
  startWeek: number,
  finalWeek: number,
  k = 0,
): number {
  const t = week;
  const ti = startWeek;
  const tm = finalWeek;
  const Si = startWeight;
  const Sm = finalWeight;
  const a = (ti - t) / (tm - ti);
  return (Si - Sm) * Math.exp(a * k) + Sm + a * (Si - Sm) * Math.exp(-k);
}

const DEFAULT_REP_SCALER = (week: number, totalWeeks: number): number => {
  const start = 1.2;
  const end = 0.8;
  return start + ((end - start) * (week - 1)) / (totalWeeks - 1);
};

const DEFAULT_INTENSITY_SCALER = (week: number, totalWeeks: number): number => {
  const start = 0.95;
  const end = 1.05;
  return start + ((end - start) * (week - 1)) / (totalWeeks - 1);
};

export function progressionSinusoidal(
  week: number,
  startWeight: number,
  finalWeight: number,
  startWeek: number,
  finalWeek: number,
  period = 4,
  scale = 0.025,
  offset = 0,
  k = 0,
): number {
  const base = progressionDiffEq(week, startWeight, finalWeight, startWeek, finalWeek, k);
  const sineArg = ((week - offset - startWeek) * Math.PI * 2) / (period <= 1 ? 1 : period);
  const withSine = base * (1 + scale * Math.sin(sineArg));
  return withSine;
}

interface SetScheme {
  reps: number[];
  intensities: number[];
  totalReps: number;
  avgIntensity: number;
}

interface SchemeOptions {
  sets: number;
  minReps: number;
  maxReps: number;
  repsSlack?: number;
  maxDiff?: number;
  maxUnique?: number;
  maxSets?: number;
}

function generateRepSchemes(
  allowedReps: number[],
  repsGoal: number,
  options: SchemeOptions,
): number[][] {
  const { repsSlack = 3, maxDiff = 1, maxUnique = 3, maxSets = 99 } = options;
  const results: number[][] = [];
  const sorted = [...new Set(allowedReps)].sort((a, b) => a - b);
  const minSets = options.sets;

  function search(stack: number[], idx: number): void {
    if (new Set(stack).size > maxUnique) return;
    if (stack.length > maxSets) return;
    if (stack.length >= minSets && Math.abs(stack.reduce((s, x) => s + x, 0) - repsGoal) <= repsSlack) {
      if (stack.length >= minSets) {
        results.push([...stack]);
      }
    }
    if (stack.reduce((s, x) => s + x, 0) > repsGoal + repsSlack) return;
    // always allow more sets, but keep within maxSets
    if (stack.length >= maxSets) return;

    for (let j = idx; j < sorted.length; j++) {
      if (stack.length === 0 || sorted[j] - stack[stack.length - 1] <= maxDiff) {
        search([...stack, sorted[j]], j);
      }
    }
  }

  if (sorted.length > 0) {
    search([], 0);
  }
  return results;
}

function optimizeSetScheme(
  allowedReps: number[],
  intensities: number[],
  repsGoal: number,
  intensityGoal: number,
  options: SchemeOptions,
): SetScheme | null {
  const schemes = generateRepSchemes(allowedReps, repsGoal, options);
  if (schemes.length === 0) return null;

  const repToIntensity = new Map(allowedReps.map((r, i) => [r, intensities[i]]));

  let best: number[] = schemes[0];
  let bestLoss = Infinity;

  for (const scheme of schemes) {
    const totalReps = scheme.reduce((s, r) => s + r, 0);
    const totalLoad = scheme.reduce((s, r) => s + r * (repToIntensity.get(r) ?? 50), 0);
    const avgIntensity = totalReps > 0 ? totalLoad / totalReps : 0;
    const loss = (totalReps - repsGoal) ** 2 + (avgIntensity - intensityGoal) ** 2;
    if (loss < bestLoss) {
      bestLoss = loss;
      best = scheme;
    }
  }

  const reps = best;
  const bestIntensities = reps.map((r) => repToIntensity.get(r) ?? 50);
  const totalReps = reps.reduce((s, r) => s + r, 0);
  const totalLoad = reps.reduce((s, r) => s + r * (repToIntensity.get(r) ?? 50), 0);

  return {
    reps,
    intensities: bestIntensities,
    totalReps,
    avgIntensity: totalReps > 0 ? totalLoad / totalReps : 0,
  };
}

function roundToNearest(value: number, nearest: number): number {
  if (nearest <= 0) return value;
  return Math.round(value / nearest) * nearest;
}

export interface WeekSchemeResult {
  week: number;
  estimated1RM: number;
  targetReps: number;
  targetIntensity: number;
  sets: SetScheme | null;
  weights: number[];
}

export function computeWeekScheme(
  week: number,
  totalWeeks: number,
  exercise: {
    sets: number;
    minReps: number;
    maxReps: number;
    startWeight: number | null;
    targetWeight: number | null;
  },
  program: {
    progressionType: ProgressionType;
    roundTo: number;
    durationWeeks: number;
  },
): WeekSchemeResult | null {
  const { sets, minReps, maxReps } = exercise;
  const startWeight = exercise.startWeight ?? null;
  const targetWeight = exercise.targetWeight ?? null;

  if (startWeight == null) return null;

  const tgt = targetWeight ?? startWeight;
  const roundTo = program.roundTo;

  const k = program.progressionType === "EXPONENTIAL" ? 1 : 0;

  const estimated1RM = progressionDiffEq(week, startWeight, tgt, 1, totalWeeks, k);
  const rounded1RM = roundToNearest(estimated1RM, roundTo);

  const baseReps = (minReps + maxReps) / 2 * sets;
  const repScaler = DEFAULT_REP_SCALER(week, totalWeeks);
  const targetReps = Math.round(baseReps * repScaler);

  const intensityScaler = DEFAULT_INTENSITY_SCALER(week, totalWeeks);
  const defaultIntensity = repsToIntensity(Math.round((minReps + maxReps) / 2));
  const targetIntensity = defaultIntensity * intensityScaler;

  const allowed = Array.from({ length: maxReps - minReps + 1 }, (_, i) => minReps + i);
  const intensities = allowed.map((r) => repsToIntensity(r));

  const scheme = optimizeSetScheme(allowed, intensities, targetReps, targetIntensity, {
    sets,
    minReps,
    maxReps,
  });

  const weights = scheme
    ? scheme.intensities.map((i) => roundToNearest((rounded1RM * i) / 100, roundTo))
    : [];

  return { week, estimated1RM: rounded1RM, targetReps, targetIntensity, sets: scheme, weights };
}

export function formatSetScheme(scheme: SetScheme, weight: number, roundTo: number, units = "kg"): string[] {
  return scheme.reps.map((r, i) => {
    const w = roundToNearest((weight * scheme.intensities[i]) / 100, roundTo);
    return `${r} × ${w}${units}`;
  });
}

export function compute1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface WarmupSet {
  weight: number;
  reps: string;
  percentage: number;
}

export function computeWarmupSets(workingWeight: number, roundTo: number): WarmupSet[] {
  if (workingWeight <= 0) return [];
  const steps: { percentage: number; reps: string }[] = [
    { percentage: 0.4, reps: "8-10" },
    { percentage: 0.6, reps: "5-6" },
    { percentage: 0.8, reps: "2-3" },
  ];
  const sets: WarmupSet[] = [];
  for (const step of steps) {
    const weight = roundToNearest(workingWeight * step.percentage, roundTo);
    if (weight <= 0) continue;
    sets.push({ weight, reps: step.reps, percentage: step.percentage });
  }
  return sets;
}

export interface SessionComparison {
  exerciseName: string;
  type: string;
  targetSets: number;
  completedSets: number;
  setsComplete: boolean;
  targetWeight: number | null;
  actualAvgWeight: number | null;
  targetIntensity: number | null;
  actualAvgIntensity: number | null;
  onTarget: boolean;
}

export function compareSession(
  logged: Record<string, { weight: number | null; reps: number | null; durationSec: number | null }[]>,
  exercises: {
    id: string;
    name: string;
    type: string;
    sets: number;
    scheme: WeekSchemeResult | null;
  }[],
): SessionComparison[] {
  return exercises.map((ex) => {
    const rows = logged[ex.id] ?? [];
    const filled = rows.filter((r) => r.reps != null || r.durationSec != null);
    const targetSets = ex.sets;
    const completedSets = filled.length;
    const setsComplete = completedSets >= targetSets;

    const targetIntensity = ex.scheme?.targetIntensity ?? null;
    const targetWeight = ex.scheme?.weights?.[0] ?? null;

    let actualAvgWeight: number | null = null;
    let actualAvgIntensity: number | null = null;

    if (ex.type === "WEIGHTED" && filled.length > 0) {
      const withWeight = filled.filter((r) => r.weight != null && r.reps != null) as {
        weight: number;
        reps: number;
      }[];
      if (withWeight.length > 0) {
        actualAvgWeight = withWeight.reduce((s, r) => s + r.weight, 0) / withWeight.length;
        const est1RMs = withWeight.map((r) => compute1RM(r.weight, r.reps));
        const avg1RM = est1RMs.reduce((s, v) => s + v, 0) / est1RMs.length;
        const avgLoad = withWeight.reduce((s, r) => s + r.weight, 0) / withWeight.length;
        if (avg1RM > 0) actualAvgIntensity = (avgLoad / avg1RM) * 100;
      }
    }

    const onTarget = setsComplete && (targetIntensity == null || actualAvgIntensity == null || Math.abs(actualAvgIntensity - targetIntensity) <= 5);

    return {
      exerciseName: ex.name,
      type: ex.type,
      targetSets,
      completedSets,
      setsComplete,
      targetWeight,
      actualAvgWeight,
      targetIntensity,
      actualAvgIntensity,
      onTarget,
    };
  });
}
