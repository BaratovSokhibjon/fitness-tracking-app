"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ExerciseTrend } from "@/queries/records";

export function ExerciseTrends({ trends }: { trends: ExerciseTrend[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(trends[0]?.exerciseId ?? null);
  const selected = trends.find((t) => t.exerciseId === selectedId) ?? trends[0] ?? null;

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercise Trends</CardTitle>
          <CardDescription>Estimated 1RM over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No logged workouts yet. Complete a session to see your strength trends here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = (selected?.points ?? []).map((p) => ({
    label: format(new Date(p.date), "MMM d"),
    value: p.estimated1RM,
  }));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Exercise Trends</CardTitle>
        <Select value={selected!.exerciseId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trends.map((t) => (
              <SelectItem key={t.exerciseId} value={t.exerciseId}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CardDescription>Estimated 1RM (Epley) across logged sessions.</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
            <Tooltip formatter={(v) => `${v} kg`} />
            <Line type="monotone" dataKey="value" stroke="#1e9e52" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
