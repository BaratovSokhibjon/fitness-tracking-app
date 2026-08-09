"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOr400 = parseOr400;
exports.badRequest = badRequest;
exports.notFound = notFound;
exports.serverError = serverError;
function parseOr400(c, schema, body) {
    const res = schema.safeParse(body);
    if (!res.success) {
        c.status(400);
        return null;
    }
    return res.data;
}
function badRequest(c, message) {
    c.status(400);
    return c.json({ error: message });
}
function notFound(c, message = "Not found") {
    c.status(404);
    return c.json({ error: message });
}
function serverError(c, message = "Internal error") {
    c.status(500);
    return c.json({ error: message });
}
