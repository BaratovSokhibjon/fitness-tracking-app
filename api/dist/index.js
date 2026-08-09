"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const check_in_1 = __importDefault(require("./routes/check-in"));
const counters_1 = __importDefault(require("./routes/counters"));
const habits_1 = __importDefault(require("./routes/habits"));
const creatine_1 = __importDefault(require("./routes/creatine"));
const foods_1 = __importDefault(require("./routes/foods"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const profile_1 = __importDefault(require("./routes/profile"));
const devices_1 = __importDefault(require("./routes/devices"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const sync_1 = __importDefault(require("./routes/sync"));
const notifications_1 = require("./services/notifications");
const app = new hono_1.Hono();
app.use("*", (0, cors_1.cors)({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
// Basic auth on everything. /auth/verify runs basicAuth too — it IS the
// credential check (returns the authenticated email or 401).
app.use("*", async (c, next) => {
    if (c.req.path === "/health" || c.req.method === "OPTIONS") {
        return next();
    }
    return (0, auth_1.basicAuth)(c, next);
});
app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));
app.route("/auth", auth_2.default);
app.route("/check-in", check_in_1.default);
app.route("/", counters_1.default); // /water /steps /caffeine
app.route("/habits", habits_1.default);
app.route("/creatine", creatine_1.default);
app.route("/foods", foods_1.default);
app.route("/schedule", schedule_1.default);
app.route("/profile", profile_1.default);
app.route("/devices", devices_1.default);
app.route("/reminders", reminders_1.default);
app.route("/sync", sync_1.default);
app.notFound((c) => c.json({ error: "Not found" }, 404));
const port = Number(process.env.PORT || 4000);
// Start the reminder cron unless explicitly disabled (e.g. in tests).
if (process.env.DISABLE_CRON !== "1") {
    (0, notifications_1.startReminderCron)();
}
(0, node_server_1.serve)({ fetch: app.fetch, port }, (info) => {
    console.log(`Somatix API listening on http://0.0.0.0:${info.port}`);
});
