"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FoodCard, FoodForm, type FoodData } from "@/components/foods/food-card";

export function FoodsPage({ foods }: { foods: FoodData[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(foods);
  const [open, setOpen] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    const term = q.trim().toLowerCase();
    if (!term) {
      setFiltered(foods);
      return;
    }
    setFiltered(foods.filter((f) => f.name.toLowerCase().includes(term) || f.category.toLowerCase().includes(term)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Foods</h1>
          <p className="text-sm text-muted-foreground">Your food database for meal logging.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Food
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Food Item</DialogTitle>
            </DialogHeader>
            <FoodForm
              onDone={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search foods…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No foods match your search.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
}
