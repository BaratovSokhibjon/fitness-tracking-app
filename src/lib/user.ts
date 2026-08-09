import "server-only";

import { prisma } from "@/lib/prisma";

// Single-user for now: all web-app data belongs to the seeded default user.
// When multi-user lands, this becomes the authenticated user's id (HTTP Basic).
export const DEFAULT_USER_ID = "default-user";

export async function getCurrentUserId(): Promise<string> {
  return DEFAULT_USER_ID;
}

export async function getDefaultUser() {
  return prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
}
