"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwise, ForkKnife, Plus, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { categoryLabels } from "@/components/foods/food-card";
import { addFoodToLog, removeFoodFromLog, getFoodLogForDate, searchFoods, copyYesterdaysMeals } from "@/actions/foods";
import { TargetProgress } from "@/components/today/target-progress";
import { MealsButton } from "@/components/today/meals-dialog";

export type FoodLogEntry = {
  id: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItem: {
    id: string;
    name: string;
    servingSize: number;
    servingUnit: string;
    caloriesPerServing: number;
    category: string;
  };
};

export function FoodSelector({ date }: { date: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchFoods>>>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      void searchFoods("").then(setResults);
      setQuery("");
      setQuantities({});
    }
  }, [open]);

  async function handleSearch(q: string) {
    setQuery(q);
    const res = await searchFoods(q);
    setResults(res);
  }

  async function handleAdd(foodId: string) {
    const qty = parseFloat(quantities[foodId] ?? "1");
    await addFoodToLog({
      date,
      foodItemId: foodId,
      quantity: Number.isNaN(qty) ? 1 : qty,
    });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ForkKnife className="h-4 w-4" />
          Log Food
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Food</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Search foods…" value={query} onChange={(e) => handleSearch(e.target.value)} />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No foods found.</p>
            ) : (
              results.map((food) => {
                return (
                  <div key={food.id} className="flex items-center justify-between gap-2 rounded-none border px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{food.name}</span>
                        <Badge variant="secondary">{categoryLabels[food.category]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {food.caloriesPerServing} kcal per {food.servingSize} {food.servingUnit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <NumberInput
                        compact
                        className="h-8 w-20"
                        value={(quantities[food.id] ?? "1") === "" ? null : parseFloat(quantities[food.id] ?? "1")}
                        onValueChange={(v) => setQuantities((q) => ({ ...q, [food.id]: v == null ? "" : String(v) }))}
                        min={0.1}
                        max={100}
                        step={0.5}
                        decimals={1}
                        placeholder="1"
                      />
                      <Button size="sm" onClick={() => handleAdd(food.id)}>
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FoodLogSection({
  date,
  targets,
}: {
  date: string;
  targets?: {
    calories: number | null | undefined;
    protein: number | null | undefined;
    carbs: number | null | undefined;
    fat: number | null | undefined;
  };
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const data = await getFoodLogForDate(date);
    setEntries(data.entries as unknown as FoodLogEntry[]);
    setLoaded(true);
  }

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    void loadRef.current();
  }, [date]);

  useEffect(() => {
    const handler = () => void loadRef.current();
    window.addEventListener("somatix:food-log-updated", handler);
    return () => window.removeEventListener("somatix:food-log-updated", handler);
  }, [date]);

  async function handleRemove(entryId: string) {
    await removeFoodFromLog(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    router.refresh();
  }

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const [copying, setCopying] = useState(false);

  async function handleCopyYesterday() {
    setCopying(true);
    try {
      const res = await copyYesterdaysMeals(date);
      await load();
      router.refresh();
      if (res.logged === 0) alert("Nothing was logged yesterday to copy.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Meal Log</CardTitle>
          <CardDescription>Logged foods for today</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {loaded && (
            <>
              <MealsButton date={date} />
              <Button variant="outline" size="sm" onClick={handleCopyYesterday} disabled={copying}>
                <ArrowClockwise className="h-4 w-4" />
                {copying ? "Copying…" : "Copy yesterday"}
              </Button>
              <FoodSelector date={date} />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-none border px-2 py-1.5">
            <p className="font-mono text-sm font-semibold tabular-nums">{totals.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="rounded-none border px-2 py-1.5">
            <p className="font-mono text-sm font-semibold tabular-nums">{Math.round(totals.protein)}g</p>
            <p className="text-xs text-muted-foreground">protein</p>
          </div>
          <div className="rounded-none border px-2 py-1.5">
            <p className="font-mono text-sm font-semibold tabular-nums">{Math.round(totals.carbs)}g</p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </div>
          <div className="rounded-none border px-2 py-1.5">
            <p className="font-mono text-sm font-semibold tabular-nums">{Math.round(totals.fat)}g</p>
            <p className="text-xs text-muted-foreground">fat</p>
          </div>
        </div>

        <div className="space-y-2">
          <TargetProgress label="Calories" current={totals.calories} target={targets?.calories} unit="kcal" />
          <TargetProgress label="Protein" current={totals.protein} target={targets?.protein} unit="g" />
          <TargetProgress label="Carbs" current={totals.carbs} target={targets?.carbs} unit="g" />
          <TargetProgress label="Fat" current={totals.fat} target={targets?.fat} unit="g" />
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-none border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">
                    {entry.foodItem.name}{" "}
                    <span className="text-xs text-muted-foreground">×{entry.quantity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.calories} kcal · P {Math.round(entry.protein)} · C {Math.round(entry.carbs)} · F {Math.round(entry.fat)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemove(entry.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
