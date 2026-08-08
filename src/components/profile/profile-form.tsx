"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { updateProfile } from "@/actions/profile";

export type ProfileData = {
  age: number | null;
  height: number | null;
  programStartDate: string | null;
  dailyCaloriesTarget: number | null;
  dailyProteinTarget: number | null;
  dailyCarbsTarget: number | null;
  dailyFatTarget: number | null;
  dailyWaterTarget: number | null;
  dailyStepsTarget: number | null;
  sleepTarget: number | null;
};

export function ProfileForm({ profile }: { profile: ProfileData | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    age: profile?.age?.toString() ?? "",
    height: profile?.height?.toString() ?? "",
    programStartDate: profile?.programStartDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    dailyCaloriesTarget: profile?.dailyCaloriesTarget?.toString() ?? "",
    dailyProteinTarget: profile?.dailyProteinTarget?.toString() ?? "",
    dailyCarbsTarget: profile?.dailyCarbsTarget?.toString() ?? "",
    dailyFatTarget: profile?.dailyFatTarget?.toString() ?? "",
    dailyWaterTarget: profile?.dailyWaterTarget?.toString() ?? "",
    dailyStepsTarget: profile?.dailyStepsTarget?.toString() ?? "",
    sleepTarget: profile?.sleepTarget?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setMessage(null);
    };
  }

  function num(v: string): number | null {
    if (v === "") return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSave() {
    setSaving(true);
    const start = form.programStartDate ? new Date(`${form.programStartDate}T00:00:00.000Z`) : null;
    await updateProfile({
      age: num(form.age),
      height: num(form.height),
      programStartDate: start ? start.toISOString() : null,
      dailyCaloriesTarget: num(form.dailyCaloriesTarget),
      dailyProteinTarget: num(form.dailyProteinTarget),
      dailyCarbsTarget: num(form.dailyCarbsTarget),
      dailyFatTarget: num(form.dailyFatTarget),
      dailyWaterTarget: num(form.dailyWaterTarget),
      dailyStepsTarget: num(form.dailyStepsTarget),
      sleepTarget: num(form.sleepTarget),
    });
    setSaving(false);
    setMessage("Saved.");
    router.refresh();
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: "age", label: "Age", placeholder: "30", type: "number" },
    { key: "height", label: "Height (cm)", placeholder: "178", type: "number" },
    { key: "dailyCaloriesTarget", label: "Daily calories target", placeholder: "2200", type: "number" },
    { key: "dailyProteinTarget", label: "Daily protein target (g)", placeholder: "160", type: "number" },
    { key: "dailyCarbsTarget", label: "Daily carbs target (g)", placeholder: "250", type: "number" },
    { key: "dailyFatTarget", label: "Daily fat target (g)", placeholder: "70", type: "number" },
    { key: "dailyWaterTarget", label: "Daily water target (ml)", placeholder: "3000", type: "number" },
    { key: "dailyStepsTarget", label: "Daily steps target", placeholder: "10000", type: "number" },
    { key: "sleepTarget", label: "Sleep target (hours)", placeholder: "8", type: "number" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Your program start date sets the week numbering.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Program start date</Label>
            <DatePicker
              date={form.programStartDate ? new Date(`${form.programStartDate}T00:00:00`) : undefined}
              onSelect={(d) => {
                if (d) setForm((f) => ({ ...f, programStartDate: format(d, "yyyy-MM-dd") }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" value={form.age} onChange={set("age")} placeholder="30" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" type="number" value={form.height} onChange={set("height")} placeholder="178" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Targets</CardTitle>
          <CardDescription>Used by the Today page counters and goals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {fields.slice(2).map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input id={f.key} type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}
