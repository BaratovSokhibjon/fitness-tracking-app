"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { NumberInput } from "@/components/ui/number-input";
import { saveMeasurement } from "@/actions/progress";

type MeasurementFormData = {
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  neck: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
};

const fields: { key: keyof MeasurementFormData; label: string; placeholder: string }[] = [
  { key: "weight", label: "Weight (kg)", placeholder: "76.8" },
  { key: "chest", label: "Chest (cm)", placeholder: "—" },
  { key: "waist", label: "Waist (cm)", placeholder: "—" },
  { key: "hips", label: "Hips (cm)", placeholder: "—" },
  { key: "neck", label: "Neck (cm)", placeholder: "—" },
  { key: "leftArm", label: "Left arm (cm)", placeholder: "—" },
  { key: "rightArm", label: "Right arm (cm)", placeholder: "—" },
  { key: "leftThigh", label: "Left thigh (cm)", placeholder: "—" },
  { key: "rightThigh", label: "Right thigh (cm)", placeholder: "—" },
];

export function MeasurementForm({ initial }: { initial?: MeasurementFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<MeasurementFormData>(
    initial ?? {
      date: new Date().toISOString().slice(0, 10),
      weight: null,
      chest: null,
      waist: null,
      hips: null,
      neck: null,
      leftArm: null,
      rightArm: null,
      leftThigh: null,
      rightThigh: null,
    }
  );
  const [saving, setSaving] = useState(false);

  function set(key: keyof MeasurementFormData) {
    return (v: number | null) => {
      setForm((f) => ({ ...f, [key]: v == null ? null : String(v) }));
    };
  }

  function num(v: string): number | null {
    if (v === "") return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSave() {
    setSaving(true);
    const date = new Date(`${form.date}T00:00:00.000Z`);
    await saveMeasurement({
      date: date.toISOString(),
      weight: num(form.weight as unknown as string),
      chest: num(form.chest as unknown as string),
      waist: num(form.waist as unknown as string),
      hips: num(form.hips as unknown as string),
      neck: num(form.neck as unknown as string),
      leftArm: num(form.leftArm as unknown as string),
      rightArm: num(form.rightArm as unknown as string),
      leftThigh: num(form.leftThigh as unknown as string),
      rightThigh: num(form.rightThigh as unknown as string),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Measurement</CardTitle>
        <CardDescription>Optional — fill in what you measured.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="measurement-date">Date</Label>
          <DatePicker
            date={form.date ? new Date(`${form.date}T00:00:00`) : undefined}
            onSelect={(d) => {
              if (d) setForm((f) => ({ ...f, date: format(d, "yyyy-MM-dd") }));
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`measurement-${f.key}`}>{f.label}</Label>
              <NumberInput
                id={`measurement-${f.key}`}
                value={form[f.key] == null || form[f.key] === "" ? null : parseFloat(form[f.key] as string)}
                onValueChange={set(f.key)}
                min={0}
                max={300}
                step={0.1}
                decimals={1}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Measurement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
