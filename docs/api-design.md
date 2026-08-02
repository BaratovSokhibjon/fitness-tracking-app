# API Design & Validation Schemas

## Architecture

All data mutations use **Next.js Server Actions**. No REST API endpoints except:
- `/api/upload` — File upload for progress photos

## Server Actions Index

| File | Actions |
|---|---|
| `actions/profile.ts` | `updateProfile`, `getProfile` |
| `actions/check-in.ts` | `saveQuickCheckIn`, `saveNutrition`, `savePostWorkout`, `getCheckIn`, `getCheckInsByDateRange` |
| `actions/water-steps.ts` | `incrementWater`, `updateSteps`, `getWater`, `getSteps` |
| `actions/program.ts` | `createProgram`, `updateProgram`, `activateProgram`, `deleteProgram` |
| `actions/workout.ts` | `createWorkout`, `updateWorkout`, `deleteWorkout`, `updateExercise`, `deleteExercise` |
| `actions/schedule.ts` | `generateSchedule`, `getScheduleForDate`, `getScheduleForMonth`, `skipWorkout` |
| `actions/session.ts` | `startSession`, `logSet`, `completeSession`, `getSessionHistory` |
| `actions/progress.ts` | `saveMeasurement`, `getMeasurements`, `uploadPhoto`, `getPhotos` |
| `actions/habits.ts` | `createHabit`, `toggleHabit`, `getHabitsForDate` |
| `actions/goals.ts` | `createGoal`, `updateGoal`, `updateGoalProgress`, `deleteGoal` |
| `actions/review.ts` | `getWeeklyReview`, `saveReviewNotes` |

---

## Zod Validation Schemas

### Profile Schema

```typescript
// src/schemas/profile.ts
import { z } from "zod";

export const profileSchema = z.object({
  age: z.number().int().min(10).max(120).nullable().optional(),
  height: z.number().min(50).max(300).nullable().optional(),
  programStartDate: z.date().nullable().optional(),
  dailyCaloriesTarget: z.number().int().min(500).max(10000).nullable().optional(),
  dailyProteinTarget: z.number().int().min(0).max(500).nullable().optional(),
  dailyCarbsTarget: z.number().int().min(0).max(1000).nullable().optional(),
  dailyFatTarget: z.number().int().min(0).max(500).nullable().optional(),
  dailyWaterTarget: z.number().int().min(0).max(10000).nullable().optional(),
  dailyStepsTarget: z.number().int().min(0).max(100000).nullable().optional(),
  sleepTarget: z.number().min(0).max(24).nullable().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
```

### Daily Check-in Schema

```typescript
// src/schemas/check-in.ts
import { z } from "zod";

export const checkInSchema = z.object({
  date: z.date(),
  morningWeight: z.number().min(20).max(300).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  calories: z.number().int().min(0).max(20000).nullable().optional(),
  protein: z.number().int().min(0).max(1000).nullable().optional(),
  carbs: z.number().int().min(0).max(2000).nullable().optional(),
  fat: z.number().int().min(0).max(1000).nullable().optional(),
  water: z.number().int().min(0).max(20000).nullable().optional(),
  steps: z.number().int().min(0).max(200000).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
  soreness: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const quickCheckInSchema = z.object({
  date: z.date(),
  morningWeight: z.number().min(20).max(300).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
});

export const postWorkoutSchema = z.object({
  date: z.date(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  soreness: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type QuickCheckInInput = z.infer<typeof quickCheckInSchema>;
export type PostWorkoutInput = z.infer<typeof postWorkoutSchema>;
```

### Water / Steps Schemas

```typescript
// src/schemas/check-in.ts (same file)

export const waterIncrementSchema = z.object({
  date: z.date(),
  amount: z.number().int().min(0).max(5000), // ml to add
});

export const stepsUpdateSchema = z.object({
  date: z.date(),
  steps: z.number().int().min(0).max(200000),
});
```

### Program Schema

```typescript
// src/schemas/program.ts
import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullable().optional(),
  durationWeeks: z.number().int().min(1).max(52),
  isActive: z.boolean().optional(),
});

export const workoutSchema = z.object({
  programId: z.string().cuid(),
  name: z.string().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6),
  notes: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const exerciseSchema = z.object({
  workoutId: z.string().cuid(),
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(20),
  repRange: z.string().min(1).max(20), // "10-20", "8-12", "AMRAP"
  restTime: z.number().int().min(0).max(600).nullable().optional(), // seconds
  notes: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
```

### Workout Session Schema

```typescript
// src/schemas/session.ts
import { z } from "zod";

export const exerciseLogSchema = z.object({
  sessionId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  setNumber: z.number().int().min(1).max(20),
  weight: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(200),
  rpe: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const sessionSchema = z.object({
  scheduleId: z.string().cuid(),
  workoutId: z.string().cuid(),
  date: z.date(),
  duration: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  exerciseLogs: z.array(exerciseLogSchema).min(1),
});

export type ExerciseLogInput = z.infer<typeof exerciseLogSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
```

### Measurement Schema

```typescript
// src/schemas/measurement.ts
import { z } from "zod";

export const measurementSchema = z.object({
  date: z.date(),
  weight: z.number().min(20).max(300).nullable().optional(),
  chest: z.number().min(30).max(200).nullable().optional(),
  waist: z.number().min(30).max(200).nullable().optional(),
  hips: z.number().min(30).max(200).nullable().optional(),
  neck: z.number().min(15).max(60).nullable().optional(),
  leftArm: z.number().min(10).max(80).nullable().optional(),
  rightArm: z.number().min(10).max(80).nullable().optional(),
  leftThigh: z.number().min(20).max(120).nullable().optional(),
  rightThigh: z.number().min(20).max(120).nullable().optional(),
});

export type MeasurementInput = z.infer<typeof measurementSchema>;
```

### Habit Schema

```typescript
// src/schemas/habit.ts
import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const habitToggleSchema = z.object({
  habitId: z.string().cuid(),
  date: z.date(),
  completed: z.boolean(),
});

export type HabitInput = z.infer<typeof habitSchema>;
export type HabitToggleInput = z.infer<typeof habitToggleSchema>;
```

### Goal Schema

```typescript
// src/schemas/goal.ts
import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).max(20),
  type: z.enum(["WEIGHT", "EXERCISE", "NUTRITION", "SLEEP", "STEPS", "OTHER"]),
  isActive: z.boolean().optional(),
});

export const goalProgressSchema = z.object({
  goalId: z.string().cuid(),
  currentValue: z.number().min(0),
});

export type GoalInput = z.infer<typeof goalSchema>;
```

---

## Server Action Patterns

Every server action follows this pattern:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { someSchema, type SomeInput } from "@/schemas/some";

export async function doSomething(input: SomeInput) {
  // 1. Validate with shared schema
  const data = someSchema.parse(input);

  // 2. Execute mutation
  const result = await prisma.someTable.create({ data });

  // 3. Revalidate affected pages
  revalidatePath("/");

  return result;
}
```

## Schedule Generation Logic

```typescript
// src/actions/schedule.ts
export async function generateSchedule(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { workouts: true },
  });
  if (!program) throw new Error("Program not found");

  const workouts = program.workouts;
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + program.durationWeeks * 7);

  // Generate schedule entries for every day in program duration
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const workout = workouts.find(w => w.dayOfWeek === dayOfWeek);

    // Use upsert to be idempotent
    await prisma.workoutSchedule.upsert({
      where: { date: d },
      create: {
        date: d,
        workoutId: workout?.id ?? null,
        status: workout ? "PLANNED" : "REST",
      },
      // Only update future entries, never override historical status
      update: d >= today ? { workoutId: workout?.id ?? null } : {},
    });
  }
}
```

## Queries (Read Operations)

Read operations live in `src/queries/` and are called directly from server components:

```typescript
// src/queries/today.ts
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, endOfWeek } from "date-fns";

export async function getTodayData() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [profile, todayCheckIn, todaySchedule, yesterdayCheckIn, todayHabits] =
    await Promise.all([
      prisma.profile.findFirst(),
      prisma.dailyCheckIn.findUnique({ where: { date: today } }),
      prisma.workoutSchedule.findUnique({
        where: { date: today },
        include: { workout: { include: { exercises: true } } },
      }),
      prisma.dailyCheckIn.findFirst({
        where: { date: { lt: today } },
        orderBy: { date: "desc" },
        select: { morningWeight: true },
      }),
      prisma.habit.findMany({
        where: { isActive: true },
        include: {
          logs: {
            where: { date: today },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  const weeklyCompleted = await prisma.workoutSchedule.count({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      status: "COMPLETED",
    },
  });

  const weeklyTotal = await prisma.workoutSchedule.count({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      status: { in: ["PLANNED", "COMPLETED", "SKIPPED"] },
    },
  });

  return {
    todaySchedule,
    weeklyProgress: { completed: weeklyCompleted, total: weeklyTotal },
    todayCheckIn,
    yesterdayWeight: yesterdayCheckIn?.morningWeight ?? null,
    todayHabits: todayHabits.map(h => ({
      id: h.id,
      name: h.name,
      completed: h.logs.length > 0 ? h.logs[0].completed : false,
    })),
    todayWater: todayCheckIn?.water ?? 0,
    todaySteps: todayCheckIn?.steps ?? 0,
    profile,
  };
}
```
