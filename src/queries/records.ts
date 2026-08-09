import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { epley1RM } from "@/lib/utils";

export type ExerciseHistoryRow = {
  sessionId: string;
  date: Date;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  rpe: number | null;
  estimated1RM: number | null;
};

export async function getExerciseHistory(exerciseId: string, limit = 5) {
  const logs = await prisma.exerciseLog.findMany({
    where: { userId: DEFAULT_USER_ID, exerciseId },
    include: { session: { select: { date: true, id: true } } },
    orderBy: [{ session: { date: "desc" } }, { setNumber: "asc" }],
    take: limit * 20,
  });

  // Group by session, keep newest sessions first.
  const bySession = new Map<string, { date: Date; rows: ExerciseHistoryRow[] }>();
  for (const log of logs) {
    const key = log.sessionId;
    if (!bySession.has(key)) {
      bySession.set(key, { date: log.session.date, rows: [] });
    }
    const entry = bySession.get(key)!;
    if (entry.rows.length >= 20) continue;
    entry.rows.push({
      sessionId: log.sessionId,
      date: log.session.date,
      setNumber: log.setNumber,
      weight: log.weight,
      reps: log.reps,
      durationSec: log.durationSec,
      rpe: log.rpe,
      estimated1RM: log.reps != null ? epley1RM(log.weight, log.reps) : null,
    });
  }

  const sessions = Array.from(bySession.values());
  sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
  return sessions.slice(0, limit).map((s) => ({
    date: s.date,
    rows: s.rows.sort((a, b) => a.setNumber - b.setNumber),
  }));
}

export type PersonalRecord = {
  exerciseId: string;
  name: string;
  type: string;
  maxWeight: number | null;
  maxReps: number | null;
  maxDurationSec: number | null;
  bestEstimated1RM: number | null;
  date: Date | null;
};

export async function getPersonalRecords() {
  const logs = await prisma.exerciseLog.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      exercise: {
        include: { exercise: { select: { id: true, name: true, type: true } } },
      },
      session: { select: { date: true } },
    },
  });

  const byExercise = new Map<
    string,
    {
      name: string;
      type: string;
      maxWeight: number | null;
      maxReps: number | null;
      maxDurationSec: number | null;
      best1RM: number | null;
      date: Date | null;
    }
  >();

  for (const log of logs) {
    const key = log.exerciseId;
    let rec = byExercise.get(key);
    if (!rec) {
      rec = {
        name: log.exercise.exercise.name,
        type: log.exercise.exercise.type,
        maxWeight: null,
        maxReps: null,
        maxDurationSec: null,
        best1RM: null,
        date: null,
      };
      byExercise.set(key, rec);
    }

    if (log.exercise.exercise.type === "TIMED") {
      if (log.durationSec != null && log.durationSec > 0 && (rec.maxDurationSec == null || log.durationSec > rec.maxDurationSec)) {
        rec.maxDurationSec = log.durationSec;
        rec.date = log.session.date;
      }
    } else {
      if (log.weight != null && log.weight > 0 && (rec.maxWeight == null || log.weight > rec.maxWeight)) {
        rec.maxWeight = log.weight;
        rec.date = log.session.date;
      }
      if (log.reps != null && log.reps > 0 && (rec.maxReps == null || log.reps > rec.maxReps)) {
        rec.maxReps = log.reps;
        rec.date = log.session.date;
      }
      const rm = log.reps != null ? epley1RM(log.weight, log.reps) : null;
      if (rm != null && (rec.best1RM == null || rm > rec.best1RM)) {
        rec.best1RM = rm;
        rec.date = log.session.date;
      }
    }
  }

  const records: PersonalRecord[] = Array.from(byExercise.entries()).map(([exerciseId, r]) => ({
    exerciseId,
    name: r.name,
    type: r.type,
    maxWeight: r.maxWeight,
    maxReps: r.maxReps,
    maxDurationSec: r.maxDurationSec,
    bestEstimated1RM: r.best1RM,
    date: r.date,
  }));

  records.sort((a, b) => (b.bestEstimated1RM ?? b.maxWeight ?? b.maxDurationSec ?? 0) - (a.bestEstimated1RM ?? a.maxWeight ?? a.maxDurationSec ?? 0));
  return records;
}

export type ExerciseTrend = {
  exerciseId: string;
  name: string;
  type: string;
  points: { date: Date; estimated1RM: number | null; maxWeight: number | null }[];
};

export async function getExercise1RMTrends(limit = 20) {
  const activeProgram = await prisma.program.findFirst({
    where: { isActive: true, userId: DEFAULT_USER_ID },
    include: {
      workouts: {
        include: {
          exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  // Exercises from the active program (or all exercises with logs if none active)
  const exerciseIds = activeProgram
    ? activeProgram.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId))
    : [];

  const logs = await prisma.exerciseLog.findMany({
    where: exerciseIds.length > 0 ? { userId: DEFAULT_USER_ID, exerciseId: { in: exerciseIds } } : { userId: DEFAULT_USER_ID },
    include: {
      exercise: { include: { exercise: { select: { name: true, type: true } } } },
      session: { select: { date: true, id: true } },
    },
    orderBy: [{ session: { date: "desc" } }, { setNumber: "asc" }],
    take: limit * 30,
  });

  // Group by exerciseId, then by session date, computing max 1RM per session.
  const byExercise = new Map<string, Map<string, { date: Date; max1RM: number | null; maxWeight: number | null }>>();
  const meta = new Map<string, { name: string; type: string }>();

  for (const log of logs) {
    const exId = log.exerciseId;
    const exName = log.exercise.exercise.name;
    const exType = log.exercise.exercise.type;
    meta.set(exId, { name: exName, type: exType });

    if (!byExercise.has(exId)) byExercise.set(exId, new Map());
    const sessions = byExercise.get(exId)!;
    const dateKey = log.session.date.toISOString();
    if (!sessions.has(dateKey)) {
      sessions.set(dateKey, { date: log.session.date, max1RM: null, maxWeight: null });
    }
    const entry = sessions.get(dateKey)!;
    const rm = log.reps != null ? epley1RM(log.weight, log.reps) : null;
    if (rm != null && (entry.max1RM == null || rm > entry.max1RM)) entry.max1RM = rm;
    if (log.weight != null && log.weight > 0 && (entry.maxWeight == null || log.weight > entry.maxWeight)) {
      entry.maxWeight = log.weight;
    }
  }

  const trends: ExerciseTrend[] = [];
  for (const [exId, sessionsMap] of byExercise.entries()) {
    const sessions = Array.from(sessionsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    trends.push({
      exerciseId: exId,
      name: meta.get(exId)!.name,
      type: meta.get(exId)!.type,
      points: sessions.map((s) => ({
        date: s.date,
        estimated1RM: s.max1RM,
        maxWeight: s.maxWeight,
      })),
    });
  }

  trends.sort((a, b) => a.name.localeCompare(b.name));
  return trends;
}

export type ExercisePR = {
  exerciseId: string;
  maxWeight: number | null;
  best1RM: number | null;
  maxReps: number | null;
  maxDurationSec: number | null;
};

export async function getExercisePRs(exerciseIds: string[]): Promise<ExercisePR[]> {
  if (exerciseIds.length === 0) return [];
  const logs = await prisma.exerciseLog.findMany({
    where: { userId: DEFAULT_USER_ID, exerciseId: { in: exerciseIds } },
    select: { exerciseId: true, weight: true, reps: true, durationSec: true },
  });

  const byExercise = new Map<string, { maxWeight: number | null; best1RM: number | null; maxReps: number | null; maxDurationSec: number | null }>();
  for (const l of logs) {
    let rec = byExercise.get(l.exerciseId);
    if (!rec) {
      rec = { maxWeight: null, best1RM: null, maxReps: null, maxDurationSec: null };
      byExercise.set(l.exerciseId, rec);
    }
    if (l.weight != null && l.weight > 0 && (rec.maxWeight == null || l.weight > rec.maxWeight)) {
      rec.maxWeight = l.weight;
    }
    if (l.reps != null && l.reps > 0 && (rec.maxReps == null || l.reps > rec.maxReps)) {
      rec.maxReps = l.reps;
    }
    if (l.durationSec != null && l.durationSec > 0 && (rec.maxDurationSec == null || l.durationSec > rec.maxDurationSec)) {
      rec.maxDurationSec = l.durationSec;
    }
    if (l.reps != null && l.weight != null && l.weight > 0 && l.reps > 0) {
      const rm = epley1RM(l.weight, l.reps);
      if (rm != null && (rec.best1RM == null || rm > rec.best1RM)) rec.best1RM = rm;
    }
  }

  return Array.from(byExercise.entries()).map(([exerciseId, r]) => ({
    exerciseId,
    maxWeight: r.maxWeight,
    best1RM: r.best1RM,
    maxReps: r.maxReps,
    maxDurationSec: r.maxDurationSec,
  }));
}
