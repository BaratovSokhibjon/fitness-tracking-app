"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProgram, deleteProgram, activateProgram } from "@/actions/program";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProgressionType } from "@prisma/client";

type ProgramEditorData = {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  progressionType: ProgressionType;
  roundTo: number;
  isActive: boolean;
};

export function ProgramEditor({ program }: { program: ProgramEditorData }) {
  const router = useRouter();
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [durationWeeks, setDurationWeeks] = useState(program.durationWeeks);
  const [progressionType, setProgressionType] = useState<ProgressionType>(program.progressionType);
  const [roundTo, setRoundTo] = useState(program.roundTo);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateProgram(program.id, {
      name,
      description,
      durationWeeks,
      progressionType,
      roundTo,
      isActive: program.isActive,
    });
    setSaving(false);
    router.refresh();
  }

  async function handleActivate() {
    await activateProgram(program.id);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete program "${program.name}"? This cannot be undone.`)) return;
    await deleteProgram(program.id);
    router.push("/program");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Details</CardTitle>
        <CardDescription>Edit the program&apos;s name, description, and duration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="program-name">Name</Label>
          <Input id="program-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="program-desc">Description</Label>
          <Textarea id="program-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="program-weeks">Duration (weeks)</Label>
          <Input
            id="program-weeks"
            type="number"
            min={1}
            max={52}
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Progression type</Label>
            <Select value={progressionType} onValueChange={(v) => setProgressionType(v as ProgressionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LINEAR">Linear</SelectItem>
                <SelectItem value="EXPONENTIAL">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-round">Weight rounding (kg)</Label>
            <Input
              id="program-round"
              type="number"
              step={0.5}
              min={0}
              max={100}
              value={roundTo}
              onChange={(e) => setRoundTo(parseFloat(e.target.value) || 2.5)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {!program.isActive && (
            <Button variant="outline" onClick={handleActivate}>
              Activate
            </Button>
          )}
          <Button variant="ghost" className="text-destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
