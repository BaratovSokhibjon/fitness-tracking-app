"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logSetSchema, sessionSchema, type LogSetInput, type SessionInput } from "@/schemas/session";
import { compute1RM } from "@/lib/progression";

export async function startSession(scheduleId: string) {
  const schedule = await prisma.workoutSchedule.findUnique({
    where: { id: scheduleId },
    include: { session: true, workout: true },
  });
  if (!schedule?.workout) throw new Error("No workout scheduled for this date");

  if (schedule.session) {
    if (!schedule.session.startedAt) {
      await prisma.workoutSession.update({
        where: { id: schedule.session.id },
        data: { startedAt: new Date() },
      });
    }
    return schedule.session;
  }

  try {
    const session = await prisma.workoutSession.create({
      data: {
        scheduleId,
        workoutId: schedule.workout.id,
        date: startOfDay(schedule.date),
        startedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidatePath(`/workout/${scheduleId}`);
    return session;
  } catch (e) {
    // Two concurrent calls can both pass the initial findUnique. Treat a unique
    // violation on scheduleId as "already created" and return the existing row.
    const existing = await prisma.workoutSession.findUnique({ where: { scheduleId } });
    if (existing) return existing;
    throw e;
  }
}

export async function logSet(input: LogSetInput) {
  const data = logSetSchema.parse(input);

  const schedule = await prisma.workoutSchedule.findUnique({
    where: { id: data.scheduleId },
    include: { session: true },
  });
  if (!schedule?.session) throw new Error("Session not started");

  const log = await prisma.exerciseLog.upsert({
    where: {
      sessionId_exerciseId_setNumber: {
        sessionId: schedule.session.id,
        exerciseId: data.exerciseId,
        setNumber: data.setNumber,
      },
    },
    update: {
      weight: data.weight,
      reps: data.reps,
      durationSec: data.durationSec,
      rpe: data.rpe,
      notes: data.notes,
    },
    create: {
      sessionId: schedule.session.id,
      exerciseId: data.exerciseId,
      setNumber: data.setNumber,
      weight: data.weight,
      reps: data.reps,
      durationSec: data.durationSec,
      rpe: data.rpe,
      notes: data.notes,
    },
  });

  revalidatePath(`/workout/${data.scheduleId}`);
  return log;
}

export async function deleteSetLog(scheduleId: string, exerciseId: string, setNumber: number) {
  const schedule = await prisma.workoutSchedule.findUnique({
    where: { id: scheduleId },
    include: { session: true },
  });
  if (!schedule?.session) return { ok: true };
  await prisma.exerciseLog.deleteMany({
    where: { sessionId: schedule.session.id, exerciseId, setNumber },
  });
  revalidatePath(`/workout/${scheduleId}`);
  return { ok: true };
}

export async function completeSession(input: SessionInput) {
  const data = sessionSchema.parse(input);
  const scheduleId = data.scheduleId;

  const schedule = await prisma.workoutSchedule.findUnique({
    where: { id: scheduleId },
    include: { session: true },
  });
  if (!schedule) throw new Error("Schedule not found");

  let session = schedule.session;
  const finishedAt = new Date();

  // Derive duration from startedAt when not supplied by the client.
  let duration = data.duration;
  if (!duration && session?.startedAt) {
    duration = Math.max(1, Math.round((finishedAt.getTime() - session.startedAt.getTime()) / 60000));
  }

  const upserted = await prisma.$transaction(async (tx) => {
    if (!session) {
      session = await tx.workoutSession.create({
        data: {
          scheduleId,
          workoutId: data.workoutId,
          date: startOfDay(new Date(data.date)),
          startedAt: new Date(),
          finishedAt,
          duration,
          notes: data.notes,
        },
      });
    } else {
      session = await tx.workoutSession.update({
        where: { id: session.id },
        data: { finishedAt, duration, notes: data.notes },
      });
    }

    for (const log of data.exerciseLogs) {
      await tx.exerciseLog.upsert({
        where: {
          sessionId_exerciseId_setNumber: {
            sessionId: session.id,
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
          },
        },
        update: {
          weight: log.weight,
          reps: log.reps,
          durationSec: log.durationSec,
          rpe: log.rpe,
          notes: log.notes,
        },
        create: {
          sessionId: session.id,
          exerciseId: log.exerciseId,
          setNumber: log.setNumber,
          weight: log.weight,
          reps: log.reps,
          durationSec: log.durationSec,
          rpe: log.rpe,
          notes: log.notes,
        },
      });
    }

    // Auto-progression: for weighted exercises with a startWeight, advance the
    // baseline from the best achieved set this session (Epley 1RM). Never regress.
    const weightedLogs = data.exerciseLogs.filter((l) => l.weight != null && l.reps != null && l.weight > 0 && l.reps > 0);
    if (weightedLogs.length > 0) {
      const templateExercises = await tx.workoutExercise.findMany({
        where: { workoutId: data.workoutId, startWeight: { not: null } },
      });
      const bestByExercise = new Map<string, { weight: number; reps: number; est1RM: number }>();
      for (const l of weightedLogs) {
        const est1RM = compute1RM(l.weight!, l.reps!);
        const current = bestByExercise.get(l.exerciseId);
        if (!current || est1RM > current.est1RM) {
          bestByExercise.set(l.exerciseId, { weight: l.weight!, reps: l.reps!, est1RM });
        }
      }
      for (const t of templateExercises) {
        const best = bestByExercise.get(t.id);
        if (!best) continue;
        const nextBaseline = Math.round(best.est1RM * 0.85 * 10) / 10;
        if (nextBaseline > (t.startWeight ?? 0)) {
          await tx.workoutExercise.update({
            where: { id: t.id },
            data: { startWeight: nextBaseline },
          });
        }
      }
    }

    return session;
  });

  await prisma.workoutSchedule.update({
    where: { id: scheduleId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/");
  revalidatePath(`/workout/${scheduleId}`);
  revalidatePath("/calendar");
  revalidatePath("/workout/history");
  revalidatePath("/program");
  return upserted;
}

export async function getSessionHistory() {
  return prisma.workoutSession.findMany({
    include: {
      workout: true,
      schedule: true,
      _count: { select: { exerciseLogs: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getSessionByScheduleId(scheduleId: string) {
  const schedule = await prisma.workoutSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      workout: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { sortOrder: "asc" },
          },
          program: true,
        },
      },
      session: {
        include: {
          exerciseLogs: {
            include: { exercise: { include: { exercise: true } } },
            orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
          },
        },
      },
    },
  });
  return schedule;
}
