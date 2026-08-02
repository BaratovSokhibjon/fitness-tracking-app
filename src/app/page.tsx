import { format } from "date-fns";
import { getTodayData } from "@/queries/today";
import { WorkoutCard } from "@/components/today/workout-card";
import { QuickCheckIn } from "@/components/today/quick-check-in";
import { HabitGrid } from "@/components/today/habit-grid";
import { WaterCounter } from "@/components/today/water-counter";
import { StepsCounter } from "@/components/today/steps-counter";
import { PostWorkoutPrompt } from "@/components/today/post-workout-prompt";

export default async function TodayPage() {
  const data = await getTodayData();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
      </header>

      <WorkoutCard
        schedule={data.todaySchedule}
        weeklyProgress={data.weeklyProgress}
      />

      {data.todaySchedule?.session && (
        <PostWorkoutPrompt
          date={new Date().toISOString()}
          initialEnergy={data.todayCheckIn?.energy ?? null}
          initialSoreness={data.todayCheckIn?.soreness ?? null}
          initialNotes={data.todayCheckIn?.notes ?? ""}
          duration={data.todaySchedule.session.duration}
        />
      )}

      <QuickCheckIn
        date={new Date().toISOString()}
        initial={{
          morningWeight: data.todayCheckIn?.morningWeight ?? data.yesterdayWeight,
          sleepHours: data.todayCheckIn?.sleepHours,
          energy: data.todayCheckIn?.energy,
          mood: data.todayCheckIn?.mood,
          calories: data.todayCheckIn?.calories,
          protein: data.todayCheckIn?.protein,
          carbs: data.todayCheckIn?.carbs,
          fat: data.todayCheckIn?.fat,
          notes: data.todayCheckIn?.notes ?? "",
        }}
      />

      <HabitGrid date={new Date().toISOString()} habits={data.todayHabits} />

      <div className="grid gap-4 sm:grid-cols-2">
        <WaterCounter
          date={new Date().toISOString()}
          water={data.todayWater}
          target={data.profile?.dailyWaterTarget ?? 3000}
        />
        <StepsCounter
          date={new Date().toISOString()}
          steps={data.todaySteps}
          target={data.profile?.dailyStepsTarget ?? 10000}
        />
      </div>
    </div>
  );
}
