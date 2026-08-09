import { Hono } from "hono";
import { z } from "zod";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, notFound, parseOr400 } from "../lib/validate";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TYPES = ["body_weight", "food_log", "water", "creatine", "caffeine", "habits", "sleep", "steps"] as const;

// Fields required in payload; defaults applied in handler below.
const reminderSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(64),
  days: z.array(z.enum(DAYS)).min(1),
  type: z.enum(TYPES),
  enabled: z.boolean(),
});

function serialize(reminder: {
  id: string;
  time: string;
  timezone: string;
  days: string;
  type: string;
  enabled: boolean;
}) {
  let days: string[] = [];
  try {
    days = JSON.parse(reminder.days);
  } catch {
    days = [];
  }
  return {
    id: reminder.id,
    time: reminder.time,
    timezone: reminder.timezone,
    days,
    type: reminder.type,
    enabled: reminder.enabled,
  };
}

const app = new Hono();

// GET /reminders
app.get("/", async (c) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: [{ time: "asc" }],
  });
  return c.json(reminders.map(serialize));
});

// POST /reminders
app.post("/", async (c) => {
  const data = parseOr400(c, reminderSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const reminder = await prisma.reminder.create({
    data: {
      userId: DEFAULT_USER_ID,
      time: data.time,
      timezone: data.timezone,
      days: JSON.stringify(data.days),
      type: data.type,
      enabled: data.enabled,
    },
  });
  return c.json(serialize(reminder));
});

// PUT /reminders/:id
app.put("/:id", async (c) => {
  const id = c.req.param("id");
  const data = parseOr400(c, reminderSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");

  const existing = await prisma.reminder.findFirst({ where: { id, userId: DEFAULT_USER_ID } });
  if (!existing) return notFound(c, "Reminder not found");

  const reminder = await prisma.reminder.update({
    where: { id },
    data: {
      time: data.time,
      timezone: data.timezone,
      days: JSON.stringify(data.days),
      type: data.type,
      enabled: data.enabled,
    },
  });
  return c.json(serialize(reminder));
});

// DELETE /reminders/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.reminder.findFirst({ where: { id, userId: DEFAULT_USER_ID } });
  if (!existing) return notFound(c, "Reminder not found");
  await prisma.reminder.delete({ where: { id } });
  return c.json({ ok: true });
});

export default app;
