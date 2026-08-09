import { Hono } from "hono";
import { z } from "zod";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";
import { badRequest, parseOr400 } from "../lib/validate";

const app = new Hono();

const deviceSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(["ios", "android"]),
});

// POST /devices — register Expo push token (upsert)
app.post("/", async (c) => {
  const data = parseOr400(c, deviceSchema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  const device = await prisma.deviceToken.upsert({
    where: { token: data.token },
    update: { userId: DEFAULT_USER_ID, platform: data.platform },
    create: { userId: DEFAULT_USER_ID, token: data.token, platform: data.platform },
  });
  return c.json(device);
});

// DELETE /devices — unregister device token (token in body to avoid URL-encoding issues)
app.delete("/", async (c) => {
  const schema = z.object({ token: z.string().min(10).max(500) });
  const data = parseOr400(c, schema, await c.req.json().catch(() => null));
  if (!data) return badRequest(c, "Invalid payload");
  await prisma.deviceToken.deleteMany({ where: { token: data.token, userId: DEFAULT_USER_ID } });
  return c.json({ ok: true });
});

export default app;
