"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDueReminders = sendDueReminders;
exports.startReminderCron = startReminderCron;
const node_cron_1 = __importDefault(require("node-cron"));
const expo_server_sdk_1 = require("expo-server-sdk");
const prisma_1 = require("../lib/prisma");
let expo = null;
function getExpo() {
    if (expo)
        return expo;
    const token = process.env.EXPO_ACCESS_TOKEN;
    expo = token ? new expo_server_sdk_1.Expo({ accessToken: token }) : new expo_server_sdk_1.Expo();
    return expo;
}
// Message title/body per reminder type.
const REMINDER_TEXT = {
    body_weight: { title: "Morning weigh-in", body: "Time to log your body weight." },
    food_log: { title: "Log your food", body: "Don't forget to track what you ate today." },
    water: { title: "Hydration check", body: "Log your water intake." },
    creatine: { title: "Creatine dose", body: "Take your creatine dose for today." },
    caffeine: { title: "Caffeine log", body: "Log today's caffeine." },
    habits: { title: "Habit check", body: "Mark today's habits." },
    sleep: { title: "Sleep log", body: "Log last night's sleep." },
    steps: { title: "Steps check", body: "Update your step count." },
};
const WEEKDAY_INDEX = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0,
};
// TZ-aware: given a reminder time "HH:MM" + IANA timezone, does the CURRENT
// instant fall on that local HH:MM and that local weekday?
function matchesNow(time, timezone, days, now = new Date()) {
    let parts;
    try {
        parts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
            weekday: "short",
        }).formatToParts(now);
    }
    catch {
        return false; // invalid IANA timezone — skip, don't brick the cron.
    }
    let hour = "0", minute = "0", weekday = "Mon";
    for (const p of parts) {
        if (p.type === "hour")
            hour = p.value;
        else if (p.type === "minute")
            minute = p.value;
        else if (p.type === "weekday")
            weekday = p.value;
    }
    const [targetH, targetM] = time.split(":").map(Number);
    if (Number(hour) !== targetH || Number(minute) !== targetM)
        return false;
    return days.includes(weekday);
}
async function sendDueReminders(now = new Date()) {
    const reminders = await prisma_1.prisma.reminder.findMany({
        where: { enabled: true, userId: prisma_1.DEFAULT_USER_ID },
    });
    const due = reminders.filter((r) => {
        let days;
        try {
            days = JSON.parse(r.days);
        }
        catch {
            days = [];
        }
        return matchesNow(r.time, r.timezone, days, now);
    });
    if (due.length === 0)
        return { sent: 0 };
    const tokens = await prisma_1.prisma.deviceToken.findMany({ where: { userId: prisma_1.DEFAULT_USER_ID } });
    const messages = [];
    for (const r of due) {
        const text = REMINDER_TEXT[r.type] ?? { title: "Somatix", body: "Reminder" };
        for (const t of tokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(t.token))
                continue;
            messages.push({
                to: t.token,
                sound: "default",
                title: text.title,
                body: text.body,
                data: { type: r.type, screen: "today" },
            });
        }
    }
    if (messages.length === 0)
        return { sent: 0 };
    const client = getExpo();
    if (!client)
        return { sent: 0 };
    const tickets = [];
    // Send in chunks of 100 (Expo limit).
    for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        try {
            const batch = await client.sendPushNotificationsAsync(chunk);
            tickets.push(...batch);
        }
        catch (e) {
            console.error("Expo send failed:", e);
        }
    }
    // Prune dead tokens (DeviceNotRegistered).
    const dead = [];
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
            const msg = messages[i];
            if (msg)
                dead.push(String(msg.to));
        }
    }
    if (dead.length > 0) {
        await prisma_1.prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
    }
    return { sent: tickets.length - dead.length, pruned: dead.length };
}
let started = false;
function startReminderCron() {
    if (started)
        return;
    started = true;
    // Run every minute, offset by a few seconds to avoid the exact minute boundary.
    node_cron_1.default.schedule("5 * * * * *", () => {
        void sendDueReminders().catch((e) => console.error("Reminder cron error:", e));
    });
    console.log("[cron] reminder scheduler started (every minute)");
}
