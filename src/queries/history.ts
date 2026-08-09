import "server-only";

import { startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";

export async function getHistoryData(days = 30) {
  const today = startOfDay(new Date());
  const start = subDays(today, days - 1);

  const [checkIns, sessions, schedules] = await Promise.all([
    prisma.dailyCheckIn.findMany({
      where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: today } },
      include: { workout: true },
      orderBy: { date: "asc" },
    }),
    prisma.workoutSchedule.findMany({
      where: { userId: DEFAULT_USER_ID, date: { gte: start, lte: today } },
    }),
  ]);

  return { checkIns, sessions, schedules, start, today };
}
