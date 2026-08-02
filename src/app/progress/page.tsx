import { getMeasurements } from "@/actions/progress";
import { MeasurementForm } from "@/components/progress/measurement-form";
import { MeasurementChart } from "@/components/progress/measurement-chart";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const measurements = await getMeasurements();

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
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Body measurements over time.</p>
      </div>

      <MeasurementForm />

      <div className="space-y-4">
        {measurements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No measurements yet. Add your first one above.
          </p>
        ) : (
          <>
            <MeasurementChart title="Weight" data={weightData} unit="kg" color="#16a34a" />
            <MeasurementChart title="Waist" data={waistData} color="#ea580c" />
            <MeasurementChart title="Chest" data={chestData} color="#7c3aed" />
            <MeasurementChart title="Arms (avg)" data={armsData} color="#2563eb" />
            <MeasurementChart title="Thighs (avg)" data={thighsData} color="#0891b2" />
          </>
        )}
      </div>
    </div>
  );
}
