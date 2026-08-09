"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function CorrCard({
  title,
  description,
  data,
  xName,
  yName,
  color,
}: {
  title: string;
  description: string;
  data: { x: number; y: number }[];
  xName: string;
  yName: string;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="x" name={xName} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="y" name={yName} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} domain={[0, 10]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [`${v}`, String(n)]} />
            <Scatter data={data} fill={color} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CorrelationsSection({
  data,
}: {
  data: { sleepHours: number | null; calories: number | null; energy: number | null }[];
}) {
  const sleepEnergy = data
    .filter((d) => d.sleepHours != null && d.energy != null)
    .map((d) => ({ x: d.sleepHours as number, y: d.energy as number }));
  const calEnergy = data
    .filter((d) => d.calories != null && d.energy != null && (d.calories as number) > 0)
    .map((d) => ({ x: (d.calories as number) / 100, y: d.energy as number }));

  return (
    <>
      <CorrCard
        title="Sleep vs Energy"
        description="Each point is a day — sleep hours vs energy rating"
        data={sleepEnergy}
        xName="Sleep (h)"
        yName="Energy"
        color="#1151ff"
      />
      <CorrCard
        title="Calories vs Energy"
        description="Each point is a day — calories (÷100) vs energy rating"
        data={calEnergy}
        xName="Calories (×100)"
        yName="Energy"
        color="#0a7281"
      />
    </>
  );
}
