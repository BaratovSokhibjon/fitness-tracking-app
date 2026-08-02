"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { measurementSchema, type MeasurementInput } from "@/schemas/measurement";
import { startOfDay } from "date-fns";

export async function saveMeasurement(input: MeasurementInput) {
  const { date, ...rest } = measurementSchema.parse(input);
  const day = startOfDay(new Date(date));

  const measurement = await prisma.bodyMeasurement.upsert({
    where: { date: day },
    update: rest,
    create: { date: day, ...rest },
  });

  revalidatePath("/progress");
  return measurement;
}

export async function getMeasurements() {
  return prisma.bodyMeasurement.findMany({
    orderBy: { date: "asc" },
  });
}

export async function uploadPhoto(date: string, type: string, file: File) {
  if (!(date && type)) throw new Error("Date and type are required");
  if (!["FRONT", "SIDE", "BACK"].includes(type)) throw new Error("Invalid photo type");

  const uploadDir = process.env.UPLOAD_DIR ?? "public/uploads";
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/${filename}`;

  const photo = await prisma.progressPhoto.create({
    data: {
      date: startOfDay(new Date(date)),
      type: type as "FRONT" | "SIDE" | "BACK",
      imageUrl,
    },
  });

  revalidatePath("/progress");
  revalidatePath("/progress/photos");
  return photo;
}

export async function getPhotos() {
  return prisma.progressPhoto.findMany({
    orderBy: { date: "desc" },
  });
}

export async function deletePhoto(id: string) {
  const photo = await prisma.progressPhoto.findUnique({ where: { id } });
  if (!photo) return { ok: false };

  await prisma.progressPhoto.delete({ where: { id } });

  const fullPath = path.join(process.cwd(), photo.imageUrl.replace(/^\//, ""));
  try {
    await import("fs/promises").then((fs) => fs.unlink(fullPath));
  } catch {
    // file already missing — ignore
  }

  revalidatePath("/progress");
  revalidatePath("/progress/photos");
  return { ok: true };
}
