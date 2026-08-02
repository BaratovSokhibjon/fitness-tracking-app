import { getProgramList } from "@/queries/calendar";
import { WorkoutForm } from "@/components/program/workout-form";

export const dynamic = "force-dynamic";

export default async function NewWorkoutPage() {
  const programs = await getProgramList();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Workout</h1>
      <WorkoutForm programs={programs} />
    </div>
  );
}
