"use client";

import { useState } from "react";
import { Footprints } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";
import { updateSteps } from "@/actions/water-steps";

export function StepsCounter({ date, steps, target }: { date: string; steps: number; target: number }) {
  const [value, setValue] = useState(steps.toString());

  async function save() {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n) && n >= 0) {
      await updateSteps({ date, steps: n });
    } else {
      setValue(steps.toString());
    }
  }

  const stepsNum = parseInt(value, 10) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-success" />
          Steps
        </CardTitle>
        <CardDescription className="font-mono font-medium tabular-nums">
          {stepsNum.toLocaleString()} / {target.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent(stepsNum, target)} />
        <div className="flex gap-2">
          <NumberInput
            value={value === "" ? null : parseFloat(value)}
            onValueChange={(v) => setValue(v == null ? "" : String(v))}
            onCommit={save}
            min={0}
            max={100000}
            step={500}
            decimals={0}
            placeholder="10000"
          />
        </div>
      </CardContent>
    </Card>
  );
}
