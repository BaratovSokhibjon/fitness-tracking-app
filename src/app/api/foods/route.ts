import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { foodItemSchema } from "@/schemas/food";

export async function GET() {
  const foods = await prisma.foodItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const items = foods.map((f) => ({
    name: f.name,
    servingSize: f.servingSize,
    servingUnit: f.servingUnit,
    caloriesPerServing: f.caloriesPerServing,
    proteinPerServing: f.proteinPerServing,
    carbsPerServing: f.carbsPerServing,
    fatPerServing: f.fatPerServing,
    category: f.category,
  }));
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const items = Array.isArray(raw) ? raw : [raw];
    if (items.length === 0) {
      return NextResponse.json({ error: "No food items provided." }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const data = foodItemSchema.parse(item);
        const existing = await prisma.foodItem.findUnique({ where: { name: data.name } });
        if (existing) {
          skipped++;
          continue;
        }
        await prisma.foodItem.create({ data });
        created++;
      } catch (e) {
        const name = typeof item === "object" && item && "name" in item ? String((item as { name: unknown }).name) : "?";
        errors.push(`${name}: ${e instanceof Error ? e.message : "validation failed"}`);
      }
    }

    return NextResponse.json(
      { created, skipped, total: items.length, errors },
      { status: errors.length ? 207 : 200 }
    );
  } catch (err) {
    console.error("Import failed:", err);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
