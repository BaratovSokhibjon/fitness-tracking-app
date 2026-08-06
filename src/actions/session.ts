"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logSetSchema, sessionSchema, type LogSetInput, type SessionInput } from "@/schemas/session";

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
      workout: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
      session: {
        include: {
          exerciseLogs: {
            include: { exercise: true },
            orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
          },
        },
      },
    },
  });
  return schedule;
}
