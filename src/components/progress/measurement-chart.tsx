"use client";

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

function formatValue(v: unknown, unit: string) {
  if (v == null || v === "") return "—";
  return `${v} ${unit}`;
}

export function MeasurementChart({
  title,
  data,
  unit = "cm",
  color = "var(--ink)",
}: {
  title: string;
  data: { date: string; value: number | null }[];
  unit?: string;
  color?: string;
}) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.date), "MMM d"),
    value: d.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{unit === "cm" ? "Centimeters" : "Kilograms"}</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
            <Tooltip formatter={(v) => formatValue(v, unit)} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
