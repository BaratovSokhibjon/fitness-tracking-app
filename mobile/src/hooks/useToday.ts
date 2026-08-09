"use client";

import { useCallback, useEffect, useState } from "react";
import { getDb } from "@/db";
import { syncNow } from "@/db/sync";
import { localCheckIn, localHabit, localCreatine, localAddFood } from "@/db/mutations";
import { api } from "@/api/endpoints";

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type TodayData = {
  date: string;
  checkIn: Record<string, any> | null;
  habits: { id: string; name: string; completed: boolean }[];
  food: { id: string; name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number }[];
  creatine: { taken: boolean; doseGrams: number | null } | null;
  schedule: any;
  weeklyProgress: { completed: number; total: number };
};

export function useToday() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const reload = useCallback(async () => {
    const db = await getDb();
    const date = todayStr();
    const [checkIn, habits, food, creatine, schedule] = await Promise.all([
      db.getFirstAsync<Record<string, any>>("SELECT * FROM checkins WHERE date = ?", date),
      db.getAllAsync<{ id: string; name: string; completed: number }>("SELECT * FROM habits ORDER BY name"),
      db.getAllAsync<Record<string, any>>("SELECT * FROM food_log WHERE date = ? ORDER BY rowid", date),
      db.getFirstAsync<{ taken: number; doseGrams: number | null }>("SELECT * FROM creatine WHERE date = ?", date),
      db.getAllAsync<Record<string, any>>("SELECT * FROM schedule WHERE date = ?", date),
    ]);
    const schedRow = schedule[0];
    setData({
      date,
      checkIn: (checkIn as any) ?? null,
      habits: (habits as any) ?? [],
      food: (food as any[]) ?? [],
      creatine: (creatine as any) ?? null,
      schedule: schedRow ? { ...schedRow, exercises: schedRow.exercises ? JSON.parse(schedRow.exercises) : [] } : null,
      weeklyProgress: { completed: 0, total: 0 },
    });
    setLoading(false);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncNow();
      await reload();
    } finally {
      setSyncing(false);
    }
  }, [reload]);

  useEffect(() => {
    reload();
    sync();
  }, [reload, sync]);

  const updateCheckIn = useCallback(
    async (fields: Parameters<typeof localCheckIn>[1]) => {
      const date = todayStr();
      await localCheckIn(date, fields);
      await reload();
    },
    [reload]
  );

  const toggleHabit = useCallback(
    async (habitId: string, completed: boolean) => {
      const date = todayStr();
      await localHabit(date, habitId, completed);
      await reload();
    },
    [reload]
  );

  const toggleCreatine = useCallback(async () => {
    const date = todayStr();
    const taken = !(data?.creatine?.taken ?? false);
    await localCreatine(date, taken, taken ? 5 : null);
    await reload();
  }, [data, reload]);

  const addFood = useCallback(
    async (foodItemId: string, name: string, quantity: number, macros: { calories: number; protein: number; carbs: number; fat: number }) => {
      const date = todayStr();
      const opId = `${date}-${foodItemId}-${Date.now()}`;
      await localAddFood(opId, date, foodItemId, quantity, { ...macros, name });
      await reload();
    },
    [reload]
  );

  return { data, loading, syncing, reload, sync, updateCheckIn, toggleHabit, toggleCreatine, addFood };
}
