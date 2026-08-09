import cron from "node-cron";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";

let expo: Expo | null = null;
function getExpo(): Expo | null {
  if (expo) return expo;
  const token = process.env.EXPO_ACCESS_TOKEN;
  expo = token ? new Expo({ accessToken: token }) : new Expo();
  return expo;
}

// Message title/body per reminder type.
const REMINDER_TEXT: Record<string, { title: string; body: string }> = {
  body_weight: { title: "Morning weigh-in", body: "Time to log your body weight." },
  food_log: { title: "Log your food", body: "Don't forget to track what you ate today." },
  water: { title: "Hydration check", body: "Log your water intake." },
  creatine: { title: "Creatine dose", body: "Take your creatine dose for today." },
  caffeine: { title: "Caffeine log", body: "Log today's caffeine." },
  habits: { title: "Habit check", body: "Mark today's habits." },
  sleep: { title: "Sleep log", body: "Log last night's sleep." },
  steps: { title: "Steps check", body: "Update your step count." },
};

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0,
};

// TZ-aware: given a reminder time "HH:MM" + IANA timezone, does the CURRENT
// instant fall on that local HH:MM and that local weekday?
function matchesNow(time: string, timezone: string, days: string[], now = new Date()): boolean {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    }).formatToParts(now);
  } catch {
    return false; // invalid IANA timezone — skip, don't brick the cron.
  }

  let hour = "0", minute = "0", weekday = "Mon";
  for (const p of parts) {
    if (p.type === "hour") hour = p.value;
    else if (p.type === "minute") minute = p.value;
    else if (p.type === "weekday") weekday = p.value;
  }

  const [targetH, targetM] = time.split(":").map(Number);
  if (Number(hour) !== targetH || Number(minute) !== targetM) return false;
  return days.includes(weekday);
}

export async function sendDueReminders(now = new Date()) {
  const reminders = await prisma.reminder.findMany({
    where: { enabled: true, userId: DEFAULT_USER_ID },
  });
  const due = reminders.filter((r) => {
    let days: string[];
    try {
      days = JSON.parse(r.days);
    } catch {
      days = [];
    }
    return matchesNow(r.time, r.timezone, days, now);
  });
  if (due.length === 0) return { sent: 0 };

  const tokens = await prisma.deviceToken.findMany({ where: { userId: DEFAULT_USER_ID } });
  const messages: ExpoPushMessage[] = [];
  for (const r of due) {
    const text = REMINDER_TEXT[r.type] ?? { title: "Somatix", body: "Reminder" };
    for (const t of tokens) {
      if (!Expo.isExpoPushToken(t.token)) continue;
      messages.push({
        to: t.token,
        sound: "default",
        title: text.title,
        body: text.body,
        data: { type: r.type, screen: "today" },
      });
    }
  }

  if (messages.length === 0) return { sent: 0 };

  const client = getExpo();
  if (!client) return { sent: 0 };
  const tickets: ExpoPushTicket[] = [];
  // Send in chunks of 100 (Expo limit).
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const batch = await client.sendPushNotificationsAsync(chunk);
      tickets.push(...batch);
    } catch (e) {
      console.error("Expo send failed:", e);
    }
  }

  // Prune dead tokens (DeviceNotRegistered).
  const dead: string[] = [];
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
      const msg = messages[i];
      if (msg) dead.push(String(msg.to));
    }
  }
  if (dead.length > 0) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
  }

  return { sent: tickets.length - dead.length, pruned: dead.length };
}

let started = false;

export function startReminderCron() {
  if (started) return;
  started = true;
  // Run every minute, offset by a few seconds to avoid the exact minute boundary.
  cron.schedule("5 * * * * *", () => {
    void sendDueReminders().catch((e) => console.error("Reminder cron error:", e));
  });
  console.log("[cron] reminder scheduler started (every minute)");
}
