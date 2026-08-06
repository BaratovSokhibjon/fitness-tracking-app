"use client";

import { useRef, useState } from "react";
import { ChevronDown, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveQuickCheckIn, saveNutrition } from "@/actions/check-in";

type Initial = {
  morningWeight: number | null | undefined;
  sleepHours: number | null | undefined;
  energy: number | null | undefined;
  mood: number | null | undefined;
  calories: number | null | undefined;
  protein: number | null | undefined;
  carbs: number | null | undefined;
  fat: number | null | undefined;
  notes: string;
};

export function QuickCheckIn({ date, initial }: { date: string; initial: Initial }) {
  const [weight, setWeight] = useState(initial.morningWeight?.toString() ?? "");
  const [sleep, setSleep] = useState(initial.sleepHours?.toString() ?? "");
  const [energy, setEnergy] = useState(initial.energy ?? 5);
  const [mood, setMood] = useState(initial.mood ?? 5);
  const [calories, setCalories] = useState(initial.calories?.toString() ?? "");
  const [protein, setProtein] = useState(initial.protein?.toString() ?? "");
  const [carbs, setCarbs] = useState(initial.carbs?.toString() ?? "");
  const [fat, setFat] = useState(initial.fat?.toString() ?? "");
  const [notes, setNotes] = useState(initial.notes);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(fn: () => Promise<unknown>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fn();
        setSavedAt(new Date().toLocaleTimeString());
      } finally {
        setSaving(false);
      }
    }, 400);
  }

  function saveQuick() {
    scheduleSave(() =>
      saveQuickCheckIn({
        date,
        morningWeight: weight ? parseFloat(weight) : null,
        sleepHours: sleep ? parseFloat(sleep) : null,
        energy,
        mood,
      })
    );
  }

  function saveExtended() {
    scheduleSave(() =>
      saveNutrition({
        date,
        morningWeight: weight ? parseFloat(weight) : null,
        sleepHours: sleep ? parseFloat(sleep) : null,
        energy,
        mood,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseInt(protein) : null,
        carbs: carbs ? parseInt(carbs) : null,
        fat: fat ? parseInt(fat) : null,
        notes,
      })
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Quick Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="weight">Morning weight (kg)</Label>
            <Input
              id="weight"
              inputMode="decimal"
              placeholder="e.g. 76.8"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={saveQuick}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sleep">Sleep (hours)</Label>
            <Input
              id="sleep"
              inputMode="decimal"
              placeholder="e.g. 7.5"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              onBlur={saveQuick}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Energy</Label>
              <span className="text-sm font-medium text-primary">{energy}/10</span>
            </div>
            <Slider min={1} max={10} step={1} value={[energy]} onValueChange={(v) => setEnergy(v[0])} onValueCommit={() => saveQuick()} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mood</Label>
              <span className="text-sm font-medium text-primary">{mood}/10</span>
            </div>
            <Slider min={1} max={10} step={1} value={[mood]} onValueChange={(v) => setMood(v[0])} onValueCommit={() => saveQuick()} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between rounded-none border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <span>Nutrition, activity & notes</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>

        {expanded && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="cal">Calories</Label>
                <Input id="cal" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} onBlur={saveExtended} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input id="protein" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} onBlur={saveExtended} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input id="carbs" inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} onBlur={saveExtended} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input id="fat" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} onBlur={saveExtended} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveExtended}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          {saving && <span>Saving…</span>}
          {savedAt && !saving && <span>Saved at {savedAt}</span>}
          {!saving && !savedAt && <span>Auto-saves on blur</span>}
          <Button variant="outline" size="sm" onClick={saveExtended} disabled={saving}>
            Save now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
