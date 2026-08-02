"use client";

import { useState } from "react";
import { Footprints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
          <Footprints className="h-5 w-5 text-emerald-600" />
          Steps
        </CardTitle>
        <CardDescription>
          {stepsNum.toLocaleString()} / {target.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent(stepsNum, target)} />
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
