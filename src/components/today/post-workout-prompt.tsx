"use client";

import { useState } from "react";
import { Confetti } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { savePostWorkout } from "@/actions/check-in";
import { formatDuration } from "@/lib/utils";

export function PostWorkoutPrompt({
  date,
  duration,
  initialEnergy,
  initialSoreness,
  initialNotes,
}: {
  date: string;
  duration: number | null;
  initialEnergy: number | null;
  initialSoreness: number | null;
  initialNotes: string;
}) {
  const [energy, setEnergy] = useState(initialEnergy ?? 7);
  const [soreness, setSoreness] = useState(initialSoreness ?? 3);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await savePostWorkout({ date, energy, soreness, notes });
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card className="border-success bg-success/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <Confetti className="h-5 w-5" />
          Workout completed {duration ? `— ${formatDuration(duration)}` : ""}
        </CardTitle>
        <CardDescription>How did it feel?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Energy</Label>
            <span className="text-sm font-medium text-primary">{energy}/10</span>
          </div>
          <Slider min={1} max={10} step={1} value={[energy]} onValueChange={(v) => setEnergy(v[0])} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Soreness</Label>
            <span className="text-sm font-medium text-primary">{soreness}/10</span>
          </div>
          <Slider min={1} max={10} step={1} value={[soreness]} onValueChange={(v) => setSoreness(v[0])} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postworkout-notes">Notes</Label>
          <Textarea
            id="postworkout-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about today's session…"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || saved}>
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
