"use client";

import { useState } from "react";
import { Flask } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { percent } from "@/lib/utils";
import { toggleCreatine } from "@/actions/creatine";
import { cn } from "@/lib/utils";

export type CreatineCardData = {
  phase: "LOADING" | "MAINTENANCE" | "NOT_STARTED";
  day: number;
  totalDays: number | null;
  recommendedDose: number;
  takenToday: boolean;
  doseGramsToday: number | null;
  streak: number;
  loadingDays: number;
};

export function CreatineCard({
  date,
  data,
  saturationDays,
}: {
  date: string;
  data: CreatineCardData;
  saturationDays: number;
}) {
  const [taken, setTaken] = useState(data.takenToday);
  const [dose, setDose] = useState<number | null>(data.doseGramsToday);

  async function handleToggle() {
    setTaken((t) => !t);
    setDose(taken ? null : (dose ?? data.recommendedDose));
    await toggleCreatine({ date });
  }

  const isLoading = data.phase === "LOADING";
  const phaseLabel =
    data.phase === "LOADING"
      ? `Loading · day ${data.day} of ${data.totalDays}`
      : data.phase === "MAINTENANCE"
        ? "Maintenance"
        : "Not started";
  const phaseBlurb =
    data.phase === "LOADING"
      ? `Take ${data.recommendedDose}g daily — split as 4 × ${data.recommendedDose / 4}g doses.`
      : data.phase === "MAINTENANCE"
        ? `Take ${data.recommendedDose}g daily to keep muscles saturated.`
        : "Set a start date in Profile to begin tracking.";

  const progressValue = isLoading && data.totalDays ? percent(data.day, data.totalDays) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flask className="h-5 w-5 text-primary" />
          Creatine
        </CardTitle>
        <CardDescription>{phaseLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progressValue} />
        <p className="text-sm leading-6 text-mute">{phaseBlurb}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-mute">
            {data.streak} day streak
            {data.phase === "MAINTENANCE" ? " · saturated" : ` · ~${saturationDays} days to saturate`}
          </span>
          {dose != null && <span className="font-medium text-ink">{dose}g today</span>}
        </div>

        <Button
          variant={taken ? "default" : "outline"}
          className={cn("w-full", taken && "")}
          onClick={handleToggle}
        >
          {taken ? "Taken today ✓" : "Mark dose as taken"}
        </Button>
      </CardContent>
    </Card>
  );
}