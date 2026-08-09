"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
exports.basicAuth = basicAuth;
const conninfo_1 = require("@hono/node-server/conninfo");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
// In-memory fixed-window rate limiter for failed auth attempts.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 10;
const MAX_ENTRIES = 1000;
function pruneAttempts(now) {
    if (attempts.size < MAX_ENTRIES)
        return;
    for (const [k, v] of attempts) {
        if (v.resetAt <= now)
            attempts.delete(k);
        if (attempts.size < MAX_ENTRIES)
            break;
    }
}
function getClientIp(c) {
    // Use the real socket address from the node server, not client-supplied
    // x-forwarded-for (which an attacker can spoof). Falls back if unavailable.
    try {
        const info = (0, conninfo_1.getConnInfo)(c);
        return info.remote?.address ?? "unknown";
    }
    catch {
        return "unknown";
    }
}
function rateLimit(key) {
    const now = Date.now();
    pruneAttempts(now);
    const cur = attempts.get(key);
    if (!cur || cur.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
    }
    cur.count += 1;
    const remaining = MAX_ATTEMPTS - cur.count;
    return { allowed: remaining >= 0, remaining: Math.max(remaining, 0) };
}
async function verifyCredentials(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return false;
    // A bcrypt hash is 60 chars ("$2a$..."). Reject the migration placeholder.
    if (!user.passwordHash.startsWith("$2"))
        return false;
    return bcryptjs_1.default.compare(password, user.passwordHash);
}
async function basicAuth(c, next) {
    const header = c.req.header("Authorization");
    if (!header || !header.startsWith("Basic ")) {
        return c.text("Unauthorized", 401, { "WWW-Authenticate": 'Basic realm="somatix"' });
    }
    const ip = getClientIp(c);
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon < 0) {
        return c.text("Unauthorized", 401);
    }
    const email = decoded.slice(0, colon).toLowerCase();
    const password = decoded.slice(colon + 1);
    if (!(await verifyCredentials(email, password))) {
        // Only failed attempts count toward the rate limit.
        const rl = rateLimit(ip);
        if (!rl.allowed) {
            return c.text("Too many attempts. Try again later.", 429);
        }
        return c.text("Unauthorized", 401);
    }
    c.set("userId", prisma_1.DEFAULT_USER_ID);
    c.set("email", email);
    await next();
}
