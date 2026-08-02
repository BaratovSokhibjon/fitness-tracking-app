"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { profileSchema, type ProfileInput } from "@/schemas/profile";

const DEFAULT_PROFILE_ID = "default-profile";

export async function updateProfile(input: ProfileInput) {
  const data = profileSchema.parse(input);

  const profile = await prisma.profile.upsert({
    where: { id: DEFAULT_PROFILE_ID },
    update: {
      ...data,
      programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
    },
    create: {
      id: DEFAULT_PROFILE_ID,
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
  const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_PROFILE_ID } });
  return profile;
}
