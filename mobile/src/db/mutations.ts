import { getDb, enqueueOp } from "./index";

// Local writes are optimistic: update SQLite immediately, enqueue an idempotent op.
// The op payload mirrors the API's sync opSchema; derived totals are never written.

export async function localCheckIn(date: string, fields: {
  morningWeight?: number | null;
  sleepHours?: number | null;
  energy?: number | null;
  mood?: number | null;
  soreness?: number | null;
  water?: number | null;
  steps?: number | null;
  caffeineMg?: number | null;
  notes?: string | null;
}) {
  const db = await getDb();
  const existing = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM checkins WHERE date = ?", date
  );
  const merged: Record<string, unknown> = { ...(existing ?? {}), ...fields };
  const asNum = (v: unknown): number | null => (typeof v === "number" ? v : v == null ? null : Number(v) || null);
  const asStr = (v: unknown): string | null => (typeof v === "string" ? v : v == null ? null : String(v));
  await db.runAsync(
    `INSERT OR REPLACE INTO checkins (date, morningWeight, sleepHours, energy, mood, soreness, water, steps, caffeineMg, calories, protein, carbs, fat, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    date,
    asNum(merged.morningWeight),
    asNum(merged.sleepHours),
    asNum(merged.energy),
    asNum(merged.mood),
    asNum(merged.soreness),
    asNum(merged.water),
    asNum(merged.steps),
    asNum(merged.caffeineMg),
    asNum(merged.calories),
    asNum(merged.protein),
    asNum(merged.carbs),
    asNum(merged.fat),
    asStr(merged.notes)
  );
  await enqueueOp("checkin", { type: "checkin", date, ...fields });
}

export async function localHabit(date: string, habitId: string, completed: boolean) {
  const db = await getDb();
  await db.runAsync("UPDATE habits SET completed = ? WHERE id = ?", completed ? 1 : 0, habitId);
  await enqueueOp("habit", { type: "habit", habitId, date, completed });
}

export async function localCreatine(date: string, taken: boolean, doseGrams: number | null) {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO creatine (date, taken, doseGrams) VALUES (?, ?, ?)",
    date,
    taken ? 1 : 0,
    doseGrams
  );
  await enqueueOp("creatine", { type: "creatine", date, taken });
}

export async function localAddFood(
  opId: string,
  date: string,
  foodItemId: string,
  quantity: number,
  macros: { calories: number; protein: number; carbs: number; fat: number; name: string }
) {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO food_log (id, date, foodItemId, quantity, calories, protein, carbs, fat, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    opId,
    date,
    foodItemId,
    quantity,
    macros.calories,
    macros.protein,
    macros.carbs,
    macros.fat,
    macros.name
  );
  await enqueueOp("food_add", { type: "food_add", opId, date, foodItemId, quantity });
}
