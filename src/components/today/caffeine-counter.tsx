"use client";

import { useState } from "react";
import { Coffee } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";
import { incrementCaffeine } from "@/actions/water-steps";

export function CaffeineCounter({ date, caffeineMg, target }: { date: string; caffeineMg: number; target: number }) {
  const [amount, setAmount] = useState(caffeineMg);

  async function add(mg: number) {
    setAmount((a) => a + mg);
    await incrementCaffeine({ date, amount: mg });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          Caffeine
        </CardTitle>
        <CardDescription className="font-mono font-medium tabular-nums">
          {amount}mg / {target}mg
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent(amount, target)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => add(63)}>
            +63mg
          </Button>
          <Button variant="outline" size="sm" onClick={() => add(95)}>
            +95mg
          </Button>
          <Button variant="outline" size="sm" onClick={() => add(160)}>
            +160mg
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
