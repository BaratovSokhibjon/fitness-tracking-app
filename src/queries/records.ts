import "server-only";

import { prisma } from "@/lib/prisma";
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
    where: { exerciseId },
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
