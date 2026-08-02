import { format } from "date-fns";
import { getHistoryData } from "@/queries/history";
import { TrendBarChart, TrendLineChart } from "@/components/history/trend-charts";

export default async function HistoryPage() {
  const { checkIns } = await getHistoryData(30);

  const byDay = new Map(
    checkIns.map((c) => [format(c.date, "MMM d"), c])
  );

  const weightData = checkIns.map((c) => ({
    label: format(c.date, "MMM d"),
    value: c.morningWeight,
  }));

  const caloriesData = checkIns.map((c) => ({
    label: format(c.date, "MMM d"),
    value: c.calories,
  }));

  const proteinData = checkIns.map((c) => ({
    label: format(c.date, "MMM d"),
    value: c.protein,
  }));

  const sleepData = checkIns.map((c) => ({
    label: format(c.date, "MMM d"),
    value: c.sleepHours,
  }));

  void byDay;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">History</h1>
      <p className="text-sm text-muted-foreground">Last 30 days of check-in trends.</p>

      <TrendLineChart title="Weight Trend" description="Morning weight (kg)" data={weightData} unit=" kg" color="#16a34a" />
      <TrendBarChart title="Calories Trend" description="Daily calories" data={caloriesData} unit=" kcal" />
      <TrendBarChart title="Protein Trend" description="Daily protein (g)" data={proteinData} unit=" g" color="#ea580c" />
      <TrendLineChart title="Sleep Trend" description="Hours of sleep" data={sleepData} unit=" h" color="#7c3aed" />
    </div>
  );
}
