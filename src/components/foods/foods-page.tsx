"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadSimple, MagnifyingGlass, Plus, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodCard, FoodForm, type FoodData } from "@/components/foods/food-card";
import { importFoodsFromJson, exportFoodsJson } from "@/actions/foods";

export function FoodsPage({ foods }: { foods: FoodData[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(foods);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(q: string) {
    setQuery(q);
    const term = q.trim().toLowerCase();
    if (!term) {
      setFiltered(foods);
      return;
    }
    setFiltered(foods.filter((f) => f.name.toLowerCase().includes(term) || f.category.toLowerCase().includes(term)));
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const text = await importFile.text();
      const res = await importFoodsFromJson(text);
      setResult(`Imported ${res.created} food${res.created === 1 ? "" : "s"} (${res.skipped} skipped as duplicates).`);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    const items = await exportFoodsJson();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foods.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-ink">Foods</h1>
          <p className="text-sm text-muted-foreground">Your food database for meal logging.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadSimple className="h-4 w-4" />
            Export JSON
          </Button>
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UploadSimple className="h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Foods from JSON</DialogTitle>
                <DialogDescription>
                  Upload a <code className="rounded bg-muted px-1">.json</code> file containing an array of food
                  items. Existing foods (matched by name) are skipped.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="food-json">JSON file</Label>
                  <Input
                    id="food-json"
                    type="file"
                    accept=".json,application/json"
                    ref={fileInputRef}
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] ?? null);
                      setError(null);
                      setResult(null);
                    }}
                  />
                </div>
                {result && <p className="text-sm text-success">{result}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end">
                  <Button onClick={handleImport} disabled={!importFile || importing}>
                    {importing ? "Importing…" : "Import"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
      </div>

      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
