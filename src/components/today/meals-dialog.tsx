"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BowlFood, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getMealTemplates, createMealTemplate, deleteMealTemplate, logMealTemplate, searchFoods } from "@/actions/foods";

type MealTemplate = Awaited<ReturnType<typeof getMealTemplates>>[number];

export function MealsButton({ date }: { date: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchFoods>>>([]);
  const [items, setItems] = useState<{ foodItemId: string; name: string; quantity: string }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    setTemplates(await getMealTemplates());
  }

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  async function handleSearch(q: string) {
    setQuery(q);
    setResults(await searchFoods(q));
  }

  async function handleLog(templateId: string) {
    await logMealTemplate(date, templateId);
    setOpen(false);
    window.dispatchEvent(new Event("somatix:food-log-updated"));
    router.refresh();
  }

  async function handleDelete(templateId: string) {
    if (!confirm("Delete this meal template?")) return;
    await deleteMealTemplate(templateId);
    await refresh();
  }

  async function handleSaveTemplate() {
    if (templates.some((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setFormError("A meal with this name already exists.");
      return;
    }
    setFormError(null);
    try {
      await createMealTemplate(
        name,
        items
          .map((i) => {
            const q = parseFloat(i.quantity);
            return { foodItemId: i.foodItemId, quantity: Number.isFinite(q) && q > 0 ? q : 1 };
          })
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save meal.");
      return;
    }
    setCreating(false);
    setName("");
    setItems([]);
    setQuery("");
    setResults([]);
    await refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BowlFood className="h-4 w-4" />
          Meals
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meal Templates</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {templates.length === 0 && !creating ? (
            <p className="text-sm text-muted-foreground">
              No meal templates yet. Create one to log a full meal in one click.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-none border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.items.map((i) => `${i.foodItem.name} ×${i.quantity}`).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" onClick={() => handleLog(t.id)}>
                      <Plus className="h-4 w-4" />
                      Log
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(t.id)}
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!creating ? (
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New meal template
            </Button>
          ) : (
            <div className="space-y-3 rounded-none border p-3">
              <Input placeholder="Meal name (e.g. Breakfast)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Search foods…" value={query} onChange={(e) => void handleSearch(e.target.value)} />
              {results.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {results.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-md border px-3 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setItems((prev) => {
                          const exists = prev.find((i) => i.foodItemId === f.id);
                          if (exists) return prev;
                          return [...prev, { foodItemId: f.id, name: f.name, quantity: "1" }];
                        });
                        setResults([]);
                        setQuery("");
                      }}
                    >
                      <span>{f.name}</span>
                      <span className="text-xs text-muted-foreground">{f.caloriesPerServing} kcal</span>
                    </button>
                  ))}
                </div>
              )}
              {items.length > 0 && (
                <div className="space-y-1.5">
                  {items.map((i) => (
                    <div key={i.foodItemId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{i.name}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Input
                          className="h-8 w-20"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={i.quantity}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((p) => (p.foodItemId === i.foodItemId ? { ...p, quantity: e.target.value } : p))
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setItems((prev) => prev.filter((p) => p.foodItemId !== i.foodItemId))}
                          aria-label={`Remove ${i.name}`}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {formError && <p className="text-xs text-sale">{formError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTemplate} disabled={!name.trim() || items.length === 0}>
                  Save meal
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                    setItems([]);
                    setQuery("");
                    setResults([]);
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
