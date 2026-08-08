import { format } from "date-fns";
import { getTodayData } from "@/queries/today";
import { WorkoutCard } from "@/components/today/workout-card";
import { QuickCheckIn } from "@/components/today/quick-check-in";
import { HabitGrid } from "@/components/today/habit-grid";
import { WaterCounter } from "@/components/today/water-counter";
import { StepsCounter } from "@/components/today/steps-counter";
import { CreatineCard } from "@/components/today/creatine-card";
import { PostWorkoutPrompt } from "@/components/today/post-workout-prompt";
import { FoodLogSection } from "@/components/today/food-log";
import { getCreatineSaturationDays } from "@/lib/creatine";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getTodayData();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-ink">Today</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
      </header>

      <WorkoutCard
        schedule={data.todaySchedule}
        weeklyProgress={data.weeklyProgress}
      />

      {data.todaySchedule?.status === "COMPLETED" && (
        <PostWorkoutPrompt
          date={new Date().toISOString()}
          initialEnergy={data.todayCheckIn?.energy ?? null}
          initialSoreness={data.todayCheckIn?.soreness ?? null}
          initialNotes={data.todayCheckIn?.notes ?? ""}
          duration={data.todaySchedule.session?.duration ?? null}
        />
      )}

      <QuickCheckIn
        date={new Date().toISOString()}
        initial={{
          morningWeight: data.todayCheckIn?.morningWeight ?? data.yesterdayCheckIn?.morningWeight ?? null,
          sleepHours: data.todayCheckIn?.sleepHours ?? data.yesterdayCheckIn?.sleepHours ?? null,
          energy: data.todayCheckIn?.energy ?? data.yesterdayCheckIn?.energy ?? null,
          mood: data.todayCheckIn?.mood ?? data.yesterdayCheckIn?.mood ?? null,
          calories: data.todayCheckIn?.calories ?? data.yesterdayCheckIn?.calories ?? null,
          protein: data.todayCheckIn?.protein ?? data.yesterdayCheckIn?.protein ?? null,
          carbs: data.todayCheckIn?.carbs ?? data.yesterdayCheckIn?.carbs ?? null,
          fat: data.todayCheckIn?.fat ?? data.yesterdayCheckIn?.fat ?? null,
          notes: data.todayCheckIn?.notes ?? "",
        }}
      />

      <FoodLogSection date={new Date().toISOString()} />

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

      {data.creatine && (
        <CreatineCard
          date={new Date().toISOString()}
          data={data.creatine}
          saturationDays={getCreatineSaturationDays(
            data.profile?.creatineProtocol ?? "MAINTENANCE_ONLY",
            data.profile?.creatineLoadingDays ?? 7
          )}
        />
      )}
    </div>
  );
}
