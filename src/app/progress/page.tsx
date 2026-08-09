import { getMeasurements } from "@/actions/progress";
import { getExercise1RMTrends } from "@/queries/records";
import { MeasurementForm } from "@/components/progress/measurement-form";
import { MeasurementChart } from "@/components/progress/measurement-chart";
import { ExerciseTrends } from "@/components/progress/exercise-trends";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [measurements, trends] = await Promise.all([getMeasurements(), getExercise1RMTrends()]);

  const weightData = measurements.map((m) => ({ date: m.date.toISOString(), value: m.weight }));
  const waistData = measurements.map((m) => ({ date: m.date.toISOString(), value: m.waist }));
  const chestData = measurements.map((m) => ({ date: m.date.toISOString(), value: m.chest }));
  const armsData = measurements.map((m) => {
    const value = m.leftArm != null && m.rightArm != null ? (m.leftArm + m.rightArm) / 2 : m.leftArm ?? m.rightArm;
    return { date: m.date.toISOString(), value };
  });
  const thighsData = measurements.map((m) => {
    const value =
      m.leftThigh != null && m.rightThigh != null ? (m.leftThigh + m.rightThigh) / 2 : m.leftThigh ?? m.rightThigh;
    return { date: m.date.toISOString(), value };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-ink">Progress</h1>
        <p className="text-sm text-muted-foreground">Body measurements over time.</p>
      </div>

      <MeasurementForm />

      <ExerciseTrends trends={trends} />

      <div className="space-y-4">
        {measurements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No measurements yet. Add your first one above.
          </p>
        ) : (
          <>
            <MeasurementChart title="Weight" data={weightData} unit="kg" color="#111111" />
            <MeasurementChart title="Waist" data={waistData} color="#0a7281" />
            <MeasurementChart title="Chest" data={chestData} color="#ed1aa0" />
            <MeasurementChart title="Arms (avg)" data={armsData} color="#007d48" />
            <MeasurementChart title="Thighs (avg)" data={thighsData} color="#4c012d" />
          </>
        )}
      </div>
    </div>
  );
}
