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
import { NumberInput } from "@/components/ui/number-input";
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
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

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
    const res = await activateProgram(program.id);
    setScheduleMsg(
      `Active. Calendar scheduled for ${program.durationWeeks} weeks (${res.created} new, ${res.updated} updated).`
    );
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
          <NumberInput
            id="program-weeks"
            value={durationWeeks}
            onValueChange={(v) => setDurationWeeks(v ?? 1)}
            min={1}
            max={52}
            step={1}
            decimals={0}
            placeholder="8"
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
                <SelectItem value="SINUSOIDAL">Sinusoidal (wave)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-round">Weight rounding (kg)</Label>
            <NumberInput
              id="program-round"
              value={roundTo}
              onValueChange={(v) => setRoundTo(v ?? 2.5)}
              min={0}
              max={100}
              step={0.5}
              decimals={1}
              placeholder="2.5"
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
        {scheduleMsg && <p className="text-xs text-success">{scheduleMsg}</p>}
      </CardContent>
    </Card>
  );
}
