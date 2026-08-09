import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const DEFAULT_USER_ID = "default-user";
