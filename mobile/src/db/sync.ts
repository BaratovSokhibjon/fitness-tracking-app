import { api } from "@/api/endpoints";
import { getDb, getMeta, setMeta, flushOps, deleteOps, deleteOpsByIds, clearPendingOps } from "./index";
import type { CheckIn, FoodLogEntry, Habit } from "@/api/endpoints";

const SYNC_SINCE_KEY = "sync-since";

// NOTE: "today" is the DEVICE's local calendar day. The server stores and returns
// dates as its own local calendar day (yyyy-MM-dd). This is consistent only when
// the device and server share a timezone (the expected self-hosted setup). The
// server serializes calendar dates as yyyy-MM-dd so the round-trip is stable.
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function syncNow(): Promise<{ pushed: number; errors: number; pulled: boolean }> {
  const db = await getDb();
  const since = await getMeta(SYNC_SINCE_KEY);

  // Push pending ops AND pull in one call. The /sync response returns both
  // the op results (with per-op failure ids) and the pulled snapshot.
  const { ops, ids, opIds } = await flushOps();
  let res;
  try {
    res = await api.sync(since, ops);
  } catch (e) {
    // Network/offline — keep ops queued for next sync.
    return { pushed: 0, errors: ops.length > 0 ? ops.length : 0, pulled: false };
  }

  const errors = res.errors ?? 0;
  const failedOpIds = (res.failedOpIds ?? []) as string[];
  const okOpIds = errors > 0
    ? opIds.filter((id): id is string => id != null && !failedOpIds.includes(id))
    : [];

  if (errors === 0) {
    // All ops applied — clear the queue and apply the pull.
    await deleteOps(ids);
    try {
      await applyPull(db, res.data, res.serverTime);
    } catch (e) {
      console.warn("applyPull failed:", e);
    }
    return { pushed: res.applied ?? 0, errors: 0, pulled: true };
  }

  // Some ops failed. Delete the ones with opIds that succeeded (applied +
  // duplicates), keep the failed ones queued for retry, and skip the pull so
  // server values don't clobber optimistic local data for the failed ops.
  // Ops without an opId are idempotent (upsert) so re-sending them is safe.
  if (okOpIds.length > 0) {
    await deleteOpsByIds(okOpIds);
  }
  return { pushed: res.applied ?? 0, errors, pulled: false };
}

async function applyPull(
  db: Awaited<ReturnType<typeof getDb>>,
  data: any,
  serverTime: string
) {
  // Check-ins: replace rows we received (full snapshot for the watermark range).
  if (Array.isArray(data.checkIns)) {
    for (const ci of data.checkIns) {
      const date = ci.date.slice(0, 10);
      await db.runAsync(
        `INSERT OR REPLACE INTO checkins (date, morningWeight, sleepHours, energy, mood, soreness, water, steps, caffeineMg, calories, protein, carbs, fat, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        date,
        ci.morningWeight,
        ci.sleepHours,
        ci.energy,
        ci.mood,
        ci.soreness,
        ci.water,
        ci.steps,
        ci.caffeineMg,
        ci.calories,
        ci.protein,
        ci.carbs,
        ci.fat,
        ci.notes
      );
    }
  }

  // Food log: replace entries for dates we have.
  if (Array.isArray(data.foodLog)) {
    const byDate = new Map<string, FoodLogEntry[]>();
    for (const f of data.foodLog) {
      const d = f.date.slice(0, 10);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(f);
    }
    for (const [date, entries] of byDate) {
      await db.runAsync("DELETE FROM food_log WHERE date = ?", date);
      for (const e of entries) {
        await db.runAsync(
          "INSERT INTO food_log (id, date, foodItemId, quantity, calories, protein, carbs, fat, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          e.id,
          date,
          e.foodItemId,
          e.quantity,
          e.calories,
          e.protein,
          e.carbs,
          e.fat,
          e.foodItem?.name ?? ""
        );
      }
    }
  }

  // Habits: full snapshot — replace local habits entirely so deactivated habits disappear.
  if (Array.isArray(data.habits)) {
    const today = todayStr();
    await db.runAsync("DELETE FROM habits");
    for (const h of data.habits as (Habit & { logDates?: { date: string; completed: boolean }[] })[]) {
      const todayLog = h.logDates?.find((l) => l.date === today);
      const completed = todayLog ? todayLog.completed : false;
      await db.runAsync(
        "INSERT OR REPLACE INTO habits (id, name, completed) VALUES (?, ?, ?)",
        h.id,
        h.name,
        completed ? 1 : 0
      );
    }
  }

  // Creatine: upsert by date.
  if (Array.isArray(data.creatine)) {
    for (const cl of data.creatine) {
      await db.runAsync(
        "INSERT OR REPLACE INTO creatine (date, taken, doseGrams) VALUES (?, ?, ?)",
        cl.date.slice(0, 10),
        1,
        cl.doseGrams
      );
    }
  }

  // Schedule: latest today row.
  if (Array.isArray(data.schedule)) {
    for (const s of data.schedule) {
      const date = s.date?.slice(0, 10) ?? "";
      await db.runAsync(
        "INSERT OR REPLACE INTO schedule (id, date, status, workoutId, workoutName, exercises) VALUES (?, ?, ?, ?, ?, ?)",
        s.id,
        date,
        s.status,
        s.workout?.id ?? null,
        s.workout?.name ?? null,
        s.workout?.exercises ? JSON.stringify(s.workout.exercises) : null
      );
    }
  }

  await setMeta(SYNC_SINCE_KEY, serverTime);
}

export async function resetSyncState() {
  const db = await getDb();
  await clearPendingOps();
  // Clear local data so a re-auth with different credentials starts clean.
  await db.runAsync("DELETE FROM checkins");
  await db.runAsync("DELETE FROM habits");
  await db.runAsync("DELETE FROM food_log");
  await db.runAsync("DELETE FROM creatine");
  await db.runAsync("DELETE FROM schedule");
  await setMeta(SYNC_SINCE_KEY, new Date(0).toISOString());
}
