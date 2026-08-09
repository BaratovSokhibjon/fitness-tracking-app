import { apiFetch } from "./client";

export type ProfileData = {
  age: number | null;
  height: number | null;
  programStartDate: string | null;
  dailyCaloriesTarget: number | null;
  dailyProteinTarget: number | null;
  dailyCarbsTarget: number | null;
  dailyFatTarget: number | null;
  dailyWaterTarget: number | null;
  dailyStepsTarget: number | null;
  dailyCaffeineTarget: number | null;
  sleepTarget: number | null;
  creatineEnabled: boolean;
  creatineProtocol: "LOADING" | "MAINTENANCE_ONLY";
  creatineStartDate: string | null;
  creatineLoadingDays: number;
  creatineLoadingDose: number;
  creatineMaintenanceDose: number;
};

export type CheckIn = {
  id?: string;
  date: string;
  morningWeight: number | null;
  sleepHours: number | null;
  energy: number | null;
  mood: number | null;
  soreness: number | null;
  water: number | null;
  steps: number | null;
  caffeineMg: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
};

export type Habit = { id: string; name: string; completed: boolean };
export type FoodItem = {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  category: string;
};
export type FoodLogEntry = {
  id: string;
  date: string;
  foodItemId: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItem: FoodItem;
  createdAt: string;
};

export type ScheduleToday = {
  schedule: {
    id: string;
    status: string;
    session: { duration: number | null; startedAt: string | null } | null;
    workout: {
      id: string;
      name: string;
      exercises: {
        id: string;
        name: string;
        type: string;
        sets: number;
        minReps: number;
        maxReps: number;
        restTime: number | null;
      }[];
    };
  } | null;
  weeklyProgress: { completed: number; total: number };
};

export type CreatineStatus = {
  phase: "LOADING" | "MAINTENANCE" | "NOT_STARTED" | null;
  day: number;
  totalDays: number | null;
  recommendedDose: number;
  takenToday: boolean;
  doseGramsToday: number | null;
  streak: number;
  loadingDays: number;
};

export type Reminder = {
  id: string;
  time: string;
  timezone: string;
  days: string[];
  type: string;
  enabled: boolean;
};

export type SyncResponse = {
  applied: number;
  errors: number;
  duplicates: number;
  failedOpIds?: string[];
  duplicateOpIds?: string[];
  serverTime: string;
  data: {
    checkIns?: any[];
    foodLog?: any[];
    habits?: any[];
    creatine?: any[];
    schedule?: any[];
  };
};

export const api = {
  getProfile: () => apiFetch<ProfileData | null>("/profile"),
  getCheckIn: (date: string) => apiFetch<CheckIn | null>(`/check-in?date=${encodeURIComponent(date)}`),
  quickCheckIn: (body: Partial<CheckIn> & { date: string }) =>
    apiFetch("/check-in/quick", { method: "POST", body }),
  water: (date: string, amount: number) => apiFetch("/water", { method: "POST", body: { date, amount } }),
  steps: (date: string, steps: number) => apiFetch("/steps", { method: "POST", body: { date, steps } }),
  caffeine: (date: string, amount: number) =>
    apiFetch("/caffeine", { method: "POST", body: { date, amount } }),
  habits: (date: string) => apiFetch<Habit[]>(`/habits?date=${encodeURIComponent(date)}`),
  toggleHabit: (habitId: string, date: string, completed: boolean) =>
    apiFetch("/habits/toggle", { method: "POST", body: { habitId, date, completed } }),
  creatine: (date: string) => apiFetch<CreatineStatus | null>(`/creatine?date=${encodeURIComponent(date)}`),
  toggleCreatine: (date: string) => apiFetch("/creatine/toggle", { method: "POST", body: { date } }),
  searchFoods: (q: string) => apiFetch<FoodItem[]>(`/foods/search?q=${encodeURIComponent(q)}`),
  foodLog: (date: string) => apiFetch<{ checkInId: string | null; entries: FoodLogEntry[] }>(`/foods/log?date=${encodeURIComponent(date)}`),
  addFood: (date: string, foodItemId: string, quantity: number) =>
    apiFetch("/foods/log", { method: "POST", body: { date, foodItemId, quantity } }),
  removeFood: (id: string) => apiFetch(`/foods/log/${encodeURIComponent(id)}`, { method: "DELETE" }),
  scheduleToday: () => apiFetch<ScheduleToday>("/schedule/today"),
  reminders: () => apiFetch<Reminder[]>("/reminders"),
  createReminder: (body: Omit<Reminder, "id">) => apiFetch("/reminders", { method: "POST", body }),
  updateReminder: (id: string, body: Omit<Reminder, "id">) =>
    apiFetch(`/reminders/${encodeURIComponent(id)}`, { method: "PUT", body }),
  deleteReminder: (id: string) => apiFetch(`/reminders/${encodeURIComponent(id)}`, { method: "DELETE" }),
  registerDevice: (token: string, platform: "ios" | "android") =>
    apiFetch("/devices", { method: "POST", body: { token, platform } }),
  unregisterDevice: (token: string) => apiFetch("/devices", { method: "DELETE", body: { token } }),
  sync: (since: string | null, ops: unknown[]) =>
    apiFetch<SyncResponse>("/sync", { method: "POST", body: { since, ops } }),
};
