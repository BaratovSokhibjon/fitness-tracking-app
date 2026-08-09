import { format } from "date-fns";
import { getTodayData } from "@/queries/today";
import { WorkoutCard } from "@/components/today/workout-card";
import { QuickCheckIn } from "@/components/today/quick-check-in";
import { HabitGrid } from "@/components/today/habit-grid";
import { WaterCounter } from "@/components/today/water-counter";
import { StepsCounter } from "@/components/today/steps-counter";
import { CreatineCard } from "@/components/today/creatine-card";
import { CaffeineCounter } from "@/components/today/caffeine-counter";
import { PostWorkoutPrompt } from "@/components/today/post-workout-prompt";
import { FoodLogSection } from "@/components/today/food-log";
import { OnboardingCard } from "@/components/today/onboarding-card";
import { getCreatineSaturationDays } from "@/lib/creatine";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getTodayData();

  const onboardingStep =
    !data.onboarding.hasProfile
      ? 1
      : !data.onboarding.hasActiveProgram
        ? 2
        : !data.onboarding.hasWorkouts
          ? 3
          : !data.onboarding.hasExercises
            ? 4
            : !data.onboarding.hasWeightedTargets
              ? 5
              : 0;

  const onboardingContent = [
    {
      title: "Set up your profile",
      description:
        "Add your targets — calories, protein, water, steps, and sleep — so Somatix can track whether you're hitting them. It only takes a minute.",
      actionLabel: "Set up profile",
      actionHref: "/profile",
    },
    {
      title: "Create a program",
      description:
        "A program is your training plan — a set of workouts on specific days of the week. Create one, then activate it from the program page to populate your calendar.",
      actionLabel: "Create a program",
      actionHref: "/program",
    },
    {
      title: "Add workouts to your program",
      description:
        "Programs need workouts — e.g. Push, Pull, Legs — each assigned to a day of the week. Add your first workout to get started.",
      actionLabel: "Add a workout",
      actionHref: "/program/workout/new",
    },
    {
      title: "Add exercises",
      description:
        "A workout is built from exercises. Add exercises from the library with sets and rep ranges to build your routine.",
      actionLabel: "Add exercises",
      actionHref: "/program/workout/new",
    },
    {
      title: "Set target weights",
      description:
        "Weighted exercises can have a start and target weight. This powers the progression engine — it tells you what to lift each week.",
      actionLabel: "Set target weights",
      actionHref: "/program",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-ink">Today</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
      </header>

      {onboardingStep > 0 ? (
        <OnboardingCard
          step={onboardingStep}
          totalSteps={5}
          title={onboardingContent[onboardingStep - 1].title}
          description={onboardingContent[onboardingStep - 1].description}
          actionLabel={onboardingContent[onboardingStep - 1].actionLabel}
          actionHref={onboardingContent[onboardingStep - 1].actionHref}
        />
      ) : (
        <>
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
            targets={{
              calories: data.profile?.dailyCaloriesTarget ?? null,
              protein: data.profile?.dailyProteinTarget ?? null,
              carbs: data.profile?.dailyCarbsTarget ?? null,
              fat: data.profile?.dailyFatTarget ?? null,
              sleep: data.profile?.sleepTarget ?? null,
            }}
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

          <FoodLogSection
            date={new Date().toISOString()}
            targets={{
              calories: data.profile?.dailyCaloriesTarget ?? null,
              protein: data.profile?.dailyProteinTarget ?? null,
              carbs: data.profile?.dailyCarbsTarget ?? null,
              fat: data.profile?.dailyFatTarget ?? null,
            }}
          />

          <HabitGrid date={new Date().toISOString()} habits={data.todayHabits} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <CaffeineCounter
              date={new Date().toISOString()}
              caffeineMg={data.todayCaffeine}
              target={data.profile?.dailyCaffeineTarget ?? 400}
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
        </>
      )}
    </div>
  );
}
