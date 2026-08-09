import { z } from "zod";
import { Context } from "hono";

export function parseOr400<T>(c: Context, schema: z.ZodType<T>, body: unknown): T | null {
  const res = schema.safeParse(body);
  if (!res.success) {
    c.status(400);
    return null;
  }
  return res.data;
}

export function badRequest(c: Context, message: string) {
  c.status(400);
  return c.json({ error: message });
}

export function notFound(c: Context, message = "Not found") {
  c.status(404);
  return c.json({ error: message });
}

export function serverError(c: Context, message = "Internal error") {
  c.status(500);
  return c.json({ error: message });
}
