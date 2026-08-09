import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("somatix.db").then(async (db) => {
      await init(db);
      return db;
    });
  }
  return dbPromise;
}

async function init(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pending_ops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opId TEXT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checkins (
      date TEXT PRIMARY KEY,
      morningWeight REAL,
      sleepHours REAL,
      energy INTEGER,
      mood INTEGER,
      soreness INTEGER,
      water INTEGER,
      steps INTEGER,
      caffeineMg INTEGER,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS food_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      foodItemId TEXT NOT NULL,
      quantity REAL NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS creatine (
      date TEXT PRIMARY KEY,
      taken INTEGER NOT NULL DEFAULT 0,
      doseGrams REAL
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id TEXT PRIMARY KEY,
      date TEXT,
      status TEXT,
      workoutId TEXT,
      workoutName TEXT,
      exercises TEXT
    );
  `);
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = ?", key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string) {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", key, value);
}

export async function enqueueOp(type: string, payload: unknown, opId?: string) {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO pending_ops (opId, type, payload, createdAt) VALUES (?, ?, ?, datetime('now'))",
    opId ?? null,
    type,
    JSON.stringify(payload)
  );
}

export async function clearPendingOps() {
  const db = await getDb();
  await db.runAsync("DELETE FROM pending_ops");
}

export async function flushOps(): Promise<{ ops: unknown[]; ids: number[]; opIds: (string | null)[] }> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; opId: string | null; type: string; payload: string }>(
    "SELECT id, opId, type, payload FROM pending_ops ORDER BY id ASC"
  );
  return {
    ops: rows.map((r) => ({ ...JSON.parse(r.payload), opId: r.opId ?? undefined })),
    ids: rows.map((r) => r.id),
    opIds: rows.map((r) => r.opId),
  };
}

export async function deleteOps(ids: number[]) {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(`DELETE FROM pending_ops WHERE id IN (${placeholders})`, ...ids);
}

export async function deleteOpsByIds(opIds: (string | null)[]) {
  const idsToDelete = opIds.filter((x): x is string => x != null);
  if (idsToDelete.length === 0) return;
  const db = await getDb();
  const placeholders = idsToDelete.map(() => "?").join(",");
  await db.runAsync(`DELETE FROM pending_ops WHERE opId IN (${placeholders})`, ...idsToDelete);
}
