"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { profileSchema, type ProfileInput } from "@/schemas/profile";

export async function updateProfile(input: ProfileInput) {
  const data = profileSchema.parse(input);

  const profile = await prisma.profile.upsert({
    where: { userId: DEFAULT_USER_ID },
    update: {
      ...data,
      programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
    },
    create: {
      userId: DEFAULT_USER_ID,
      ...data,
      programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/review");
  return profile;
}

export async function getProfile() {
  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  return profile;
}
