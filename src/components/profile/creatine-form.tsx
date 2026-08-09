"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Flask } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { NumberInput } from "@/components/ui/number-input";
import { updateCreatineConfig } from "@/actions/creatine";

export type CreatineConfigData = {
  enabled: boolean;
  protocol: "LOADING" | "MAINTENANCE_ONLY";
  startDate: string | null;
  loadingDays: number;
  loadingDose: number;
  maintenanceDose: number;
};

export function CreatineForm({ config }: { config: CreatineConfigData | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    enabled: config?.enabled ?? false,
    protocol: config?.protocol ?? "MAINTENANCE_ONLY",
    startDate: config?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    loadingDays: config?.loadingDays?.toString() ?? "7",
    loadingDose: config?.loadingDose?.toString() ?? "20",
    maintenanceDose: config?.maintenanceDose?.toString() ?? "5",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function num(v: string): number | null {
    if (v === "") return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const start = form.startDate ? new Date(`${form.startDate}T00:00:00.000Z`) : null;
    await updateCreatineConfig({
      enabled: form.enabled,
      protocol: form.protocol,
      startDate: start ? start.toISOString() : null,
      loadingDays: num(form.loadingDays) ?? 7,
      loadingDose: num(form.loadingDose) ?? 20,
      maintenanceDose: num(form.maintenanceDose) ?? 5,
    });
    setSaving(false);
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flask className="h-5 w-5 text-primary" />
          Creatine intake
        </CardTitle>
        <CardDescription>
          Loading (20–25g/day for 5–7 days) saturates muscles in ~1 week; maintenance-only (3–5g/day)
          reaches the same saturation in 3–4 weeks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="creatine-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 accent-ink"
          />
          <Label htmlFor="creatine-enabled">Track creatine intake</Label>
        </div>

        {form.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="creatine-protocol">Protocol</Label>
                <select
                  id="creatine-protocol"
                  value={form.protocol}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, protocol: e.target.value as "LOADING" | "MAINTENANCE_ONLY" }))
                  }
                  className="h-10 w-full rounded-none border border-hairline bg-canvas px-3 text-sm text-ink"
                >
                  <option value="LOADING">Load then maintain</option>
                  <option value="MAINTENANCE_ONLY">Maintenance only</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="creatine-start">Start date</Label>
                <DatePicker
                  date={form.startDate ? new Date(`${form.startDate}T00:00:00`) : undefined}
                  onSelect={(d) => {
                    if (d) setForm((f) => ({ ...f, startDate: format(d, "yyyy-MM-dd") }));
                  }}
                />
              </div>
              {form.protocol === "LOADING" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="creatine-days">Loading days</Label>
                  <NumberInput
                    id="creatine-days"
                    value={form.loadingDays === "" ? null : parseFloat(form.loadingDays)}
                    onValueChange={(v) => setForm((f) => ({ ...f, loadingDays: v == null ? "" : String(v) }))}
                    min={1}
                    max={30}
                    step={1}
                    decimals={0}
                    placeholder="7"
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3 sm:col-span-1" />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {form.protocol === "LOADING" && (
                <div className="space-y-1.5">
                  <Label htmlFor="creatine-loading-dose">Loading dose (g/day)</Label>
                  <NumberInput
                    id="creatine-loading-dose"
                    value={form.loadingDose === "" ? null : parseFloat(form.loadingDose)}
                    onValueChange={(v) => setForm((f) => ({ ...f, loadingDose: v == null ? "" : String(v) }))}
                    min={0}
                    max={50}
                    step={1}
                    decimals={1}
                    placeholder="20"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="creatine-maint-dose">Maintenance dose (g/day)</Label>
                <NumberInput
                  id="creatine-maint-dose"
                  value={form.maintenanceDose === "" ? null : parseFloat(form.maintenanceDose)}
                  onValueChange={(v) => setForm((f) => ({ ...f, maintenanceDose: v == null ? "" : String(v) }))}
                  min={0}
                  max={50}
                  step={0.5}
                  decimals={1}
                  placeholder="5"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Creatine"}
          </Button>
          {message && <span className="text-sm text-muted-foreground">{message}</span>}
        </div>
      </CardContent>
    </Card>
  );
}