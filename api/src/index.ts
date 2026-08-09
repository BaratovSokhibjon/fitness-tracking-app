import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { basicAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import checkInRoutes from "./routes/check-in";
import countersRoutes from "./routes/counters";
import habitsRoutes from "./routes/habits";
import creatineRoutes from "./routes/creatine";
import foodsRoutes from "./routes/foods";
import scheduleRoutes from "./routes/schedule";
import profileRoutes from "./routes/profile";
import devicesRoutes from "./routes/devices";
import remindersRoutes from "./routes/reminders";
import syncRoutes from "./routes/sync";
import { startReminderCron } from "./services/notifications";

const app = new Hono();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));

// Basic auth on everything. /auth/verify runs basicAuth too — it IS the
// credential check (returns the authenticated email or 401).
app.use("*", async (c, next) => {
  if (c.req.path === "/health" || c.req.method === "OPTIONS") {
    return next();
  }
  return basicAuth(c, next);
});

app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route("/auth", authRoutes);
app.route("/check-in", checkInRoutes);
app.route("/", countersRoutes); // /water /steps /caffeine
app.route("/habits", habitsRoutes);
app.route("/creatine", creatineRoutes);
app.route("/foods", foodsRoutes);
app.route("/schedule", scheduleRoutes);
app.route("/profile", profileRoutes);
app.route("/devices", devicesRoutes);
app.route("/reminders", remindersRoutes);
app.route("/sync", syncRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

const port = Number(process.env.PORT || 4000);

// Start the reminder cron unless explicitly disabled (e.g. in tests).
if (process.env.DISABLE_CRON !== "1") {
  startReminderCron();
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Somatix API listening on http://0.0.0.0:${info.port}`);
});
