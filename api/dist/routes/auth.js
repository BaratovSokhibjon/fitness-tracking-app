"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const prisma_1 = require("../lib/prisma");
const app = new hono_1.Hono();
// GET /auth/verify — validate Basic credentials, return email + user
app.get("/verify", async (c) => {
    const email = c.get("email");
    const user = await prisma_1.prisma.user.findUnique({ where: { id: prisma_1.DEFAULT_USER_ID } });
    return c.json({ email, userId: prisma_1.DEFAULT_USER_ID, exists: Boolean(user) });
});
exports.default = app;
