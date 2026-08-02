import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dateStr = formData.get("date") as string | null;
    const type = formData.get("type") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!dateStr || !type) return NextResponse.json({ error: "Date and type are required" }, { status: 400 });
    if (!["FRONT", "SIDE", "BACK"].includes(type)) {
      return NextResponse.json({ error: "Invalid photo type" }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;

    const photo = await prisma.progressPhoto.create({
      data: {
        date: startOfDay(new Date(dateStr)),
        type: type as "FRONT" | "SIDE" | "BACK",
        imageUrl,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
