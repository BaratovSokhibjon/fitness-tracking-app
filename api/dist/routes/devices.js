"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../lib/validate");
const app = new hono_1.Hono();
const deviceSchema = zod_1.z.object({
    token: zod_1.z.string().min(10).max(500),
    platform: zod_1.z.enum(["ios", "android"]),
});
// POST /devices — register Expo push token (upsert)
app.post("/", async (c) => {
    const data = (0, validate_1.parseOr400)(c, deviceSchema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    const device = await prisma_1.prisma.deviceToken.upsert({
        where: { token: data.token },
        update: { userId: prisma_1.DEFAULT_USER_ID, platform: data.platform },
        create: { userId: prisma_1.DEFAULT_USER_ID, token: data.token, platform: data.platform },
    });
    return c.json(device);
});
// DELETE /devices — unregister device token (token in body to avoid URL-encoding issues)
app.delete("/", async (c) => {
    const schema = zod_1.z.object({ token: zod_1.z.string().min(10).max(500) });
    const data = (0, validate_1.parseOr400)(c, schema, await c.req.json().catch(() => null));
    if (!data)
        return (0, validate_1.badRequest)(c, "Invalid payload");
    await prisma_1.prisma.deviceToken.deleteMany({ where: { token: data.token, userId: prisma_1.DEFAULT_USER_ID } });
    return c.json({ ok: true });
});
exports.default = app;
