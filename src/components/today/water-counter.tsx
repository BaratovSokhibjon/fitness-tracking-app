"use client";

import { useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";
import { incrementWater } from "@/actions/water-steps";

export function WaterCounter({ date, water, target }: { date: string; water: number; target: number }) {
  const [amount, setAmount] = useState(water);

  async function add(ml: number) {
    setAmount((a) => a + ml);
    await incrementWater({ date, amount: ml });
  }

  const litres = (amount / 1000).toFixed(1);
  const targetLitres = (target / 1000).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Drop className="h-5 w-5 text-info" />
          Water
        </CardTitle>
        <CardDescription>
          {litres}L / {targetLitres}L
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent(amount, target)} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => add(250)}>
            +250ml
          </Button>
          <Button variant="outline" size="sm" onClick={() => add(500)}>
            +500ml
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
