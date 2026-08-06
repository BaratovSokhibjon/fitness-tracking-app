"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFood, updateFood, deleteFood } from "@/actions/foods";

export type FoodCategory = "PROTEIN" | "CARBS" | "FATS" | "MEAL" | "SNACK" | "DRINK" | "OTHER";

export const categoryLabels: Record<FoodCategory, string> = {
  PROTEIN: "Protein",
  CARBS: "Carbs",
  FATS: "Fats",
  MEAL: "Meal",
  SNACK: "Snack",
  DRINK: "Drink",
  OTHER: "Other",
};

export type FoodData = {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  category: FoodCategory;
  imageUrl: string | null;
};

export function FoodForm({ onDone, food }: { onDone: () => void; food?: FoodData }) {
  const [form, setForm] = useState<{
    name: string;
    servingSize: string;
    servingUnit: string;
    caloriesPerServing: string;
    proteinPerServing: string;
    carbsPerServing: string;
    fatPerServing: string;
    category: FoodCategory;
  }>({
    name: food?.name ?? "",
    servingSize: food?.servingSize?.toString() ?? "100",
    servingUnit: food?.servingUnit ?? "g",
    caloriesPerServing: food?.caloriesPerServing?.toString() ?? "",
    proteinPerServing: food?.proteinPerServing?.toString() ?? "",
    carbsPerServing: food?.carbsPerServing?.toString() ?? "",
    fatPerServing: food?.fatPerServing?.toString() ?? "",
    category: (food?.category as FoodCategory) ?? "PROTEIN",
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function num(v: string): number {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }

  async function handleSubmit() {
    if (!form.name) return;
    const data = {
      name: form.name,
      servingSize: num(form.servingSize),
      servingUnit: form.servingUnit,
      caloriesPerServing: Math.round(num(form.caloriesPerServing)),
      proteinPerServing: num(form.proteinPerServing),
      carbsPerServing: num(form.carbsPerServing),
      fatPerServing: num(form.fatPerServing),
      category: form.category as FoodCategory,
    };
    if (food) {
      await updateFood(food.id, data);
    } else {
      await createFood(data);
    }
    onDone();
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="food-name">Name</Label>
        <Input id="food-name" value={form.name} onChange={set("name")} placeholder="Chicken Breast" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="food-serving">Serving size</Label>
          <Input id="food-serving" type="number" step="0.1" value={form.servingSize} onChange={set("servingSize")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-unit">Unit</Label>
          <Input id="food-unit" value={form.servingUnit} onChange={set("servingUnit")} placeholder="g" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="food-cal">Calories / serving</Label>
          <Input id="food-cal" type="number" value={form.caloriesPerServing} onChange={set("caloriesPerServing")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-cat">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as FoodCategory }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="food-protein">Protein (g)</Label>
          <Input id="food-protein" type="number" step="0.1" value={form.proteinPerServing} onChange={set("proteinPerServing")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-carbs">Carbs (g)</Label>
          <Input id="food-carbs" type="number" step="0.1" value={form.carbsPerServing} onChange={set("carbsPerServing")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-fat">Fat (g)</Label>
          <Input id="food-fat" type="number" step="0.1" value={form.fatPerServing} onChange={set("fatPerServing")} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={!form.name}>
          {food ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function FoodCard({ food }: { food: FoodData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete food "${food.name}"?`)) return;
    await deleteFood(food.id);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              <span className="truncate">{food.name}</span>
              <Badge variant="secondary">{categoryLabels[food.category]}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              {food.servingSize} {food.servingUnit} · {food.caloriesPerServing} kcal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              P {food.proteinPerServing} · C {food.carbsPerServing} · F {food.fatPerServing} g
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <PencilSimple className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Food</DialogTitle>
                </DialogHeader>
                <FoodForm
                  food={food}
                  onDone={() => {
                    setOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
