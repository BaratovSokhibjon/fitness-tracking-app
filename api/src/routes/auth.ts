import { Hono } from "hono";
import { prisma, DEFAULT_USER_ID } from "../lib/prisma";

const app = new Hono();

// GET /auth/verify — validate Basic credentials, return email + user
app.get("/verify", async (c) => {
  const email = c.get("email");
  const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  return c.json({ email, userId: DEFAULT_USER_ID, exists: Boolean(user) });
});

export default app;
