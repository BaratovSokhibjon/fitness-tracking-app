# Database Schema

Single-user application. No `User` table — all data belongs to the single instance.

## Entity Relationship Diagram

```
Profile (single row, no FK)

Program ──1:N── Workout
Workout ──1:N── Exercise

WorkoutSchedule ──N:1── Workout (nullable, null = rest day)
WorkoutSchedule ──1:1── WorkoutSession (optional)

WorkoutSession ──1:N── ExerciseLog
WorkoutSession ──N:1── Workout (template reference)

ExerciseLog ──N:1── Exercise (template reference)

Habit ──1:N── HabitLog
```

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─── Profile ────────────────────────────────────────────

model Profile {
  id                  String   @id @default(cuid())
  age                 Int?
  height              Float?   // cm
  programStartDate    DateTime?
  dailyCaloriesTarget Int?
  dailyProteinTarget  Int?     // grams
  dailyCarbsTarget    Int?
  dailyFatTarget      Int?
  dailyWaterTarget    Int?     // ml
  dailyStepsTarget    Int?
  sleepTarget         Float?   // hours
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// ─── Program & Workout Templates ────────────────────────

model Program {
  id            String    @id @default(cuid())
  name          String
  description   String?   @db.Text
  durationWeeks Int       @default(8)
  isActive      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  workouts Workout[]
}

model Workout {
  id        String  @id @default(cuid())
  programId String
  name      String           // "Push", "Pull", "Legs", "Full Body"
  dayOfWeek Int              // 0=Sunday, 1=Monday, ..., 6=Saturday
  notes     String? @db.Text
  sortOrder Int     @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  program   Program     @relation(fields: [programId], references: [id], onDelete: Cascade)
  exercises Exercise[]
  schedules WorkoutSchedule[]
  sessions  WorkoutSession[]

  @@unique([programId, dayOfWeek])
}

model Exercise {
  id        String  @id @default(cuid())
  workoutId String
  name      String              // "Push-ups", "Squats", etc.
  sets      Int
  repRange  String              // "10-20", "8-12", etc.
  restTime  Int?                // seconds
  notes     String? @db.Text
  sortOrder Int     @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workout      Workout       @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exerciseLogs ExerciseLog[]
}

// ─── Workout Calendar ───────────────────────────────────

model WorkoutSchedule {
  id        String         @id @default(cuid())
  date      DateTime
  workoutId String?
  status    ScheduleStatus @default(PLANNED)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  workout Workout?         @relation(fields: [workoutId], references: [id], onDelete: SetNull)
  session WorkoutSession?

  @@unique([date])
}

enum ScheduleStatus {
  PLANNED
  COMPLETED
  SKIPPED
  REST
}

// ─── Workout Execution Log ──────────────────────────────

model WorkoutSession {
  id         String   @id @default(cuid())
  scheduleId String   @unique
  workoutId  String
  date       DateTime
  duration   Int?     // minutes
  notes      String?  @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  schedule     WorkoutSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  workout      Workout         @relation(fields: [workoutId], references: [id], onDelete: Restrict)
  exerciseLogs ExerciseLog[]
}

model ExerciseLog {
  id         String  @id @default(cuid())
  sessionId  String
  exerciseId String
  setNumber  Int
  weight     Float?  // kg
  reps       Int
  rpe        Float?  // 1-10 scale
  notes      String? @db.Text
  createdAt  DateTime @default(now())

  session  WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exercise Exercise       @relation(fields: [exerciseId], references: [id], onDelete: Restrict)

  @@unique([sessionId, exerciseId, setNumber])
}

// ─── Daily Check-in ─────────────────────────────────────

model DailyCheckIn {
  id            String   @id @default(cuid())
  date          DateTime
  morningWeight Float?
  sleepHours    Float?
  calories      Int?
  protein       Int?     // grams
  carbs         Int?     // grams
  fat           Int?     // grams
  water         Int?     // ml
  steps         Int?
  energy        Int?     // 1-10
  mood          Int?     // 1-10
  soreness      Int?     // 1-10
  notes         String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([date])
}

// ─── Habits ─────────────────────────────────────────────

model Habit {
  id        String   @id @default(cuid())
  name      String              // "Creatine", "Vitamins", etc.
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  logs HabitLog[]

  @@unique([name])
}

model HabitLog {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime
  completed Boolean
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
}

// ─── Body Measurements ──────────────────────────────────

model BodyMeasurement {
  id          String   @id @default(cuid())
  date        DateTime
  weight      Float?
  chest       Float?
  waist       Float?
  hips        Float?
  neck        Float?
  leftArm     Float?
  rightArm    Float?
  leftThigh   Float?
  rightThigh  Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([date])
}

// ─── Progress Photos ────────────────────────────────────

model ProgressPhoto {
  id       String    @id @default(cuid())
  date     DateTime
  type     PhotoType
  imageUrl String
  createdAt DateTime @default(now())
}

enum PhotoType {
  FRONT
  SIDE
  BACK
}

// ─── Goals ──────────────────────────────────────────────

model Goal {
  id           String   @id @default(cuid())
  name         String              // "Target Weight", "10 Pull-ups"
  targetValue  Float
  currentValue Float    @default(0)
  unit         String              // "kg", "reps", "g", "hours"
  type         GoalType
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum GoalType {
  WEIGHT
  EXERCISE
  NUTRITION
  SLEEP
  STEPS
  OTHER
}
```

## Table Summary

| Table | Purpose | Key Constraints |
|---|---|---|
| `Profile` | User targets & baselines | single row |
| `Program` | Program template (8-week plan) | — |
| `Workout` | Day-specific workout template | unique(programId, dayOfWeek) |
| `Exercise` | Exercise within a workout | workout → exercises |
| `WorkoutSchedule` | Generated daily calendar entry | unique(date) |
| `WorkoutSession` | Completed workout log | 1:1 with schedule |
| `ExerciseLog` | Individual set performance | unique(session, exercise, set) |
| `DailyCheckIn` | Daily health/nutrition log | unique(date) |
| `Habit` | Habit definition | unique(name) |
| `HabitLog` | Daily habit completion | unique(habitId, date) |
| `BodyMeasurement` | Periodic measurements | unique(date) |
| `ProgressPhoto` | Uploaded photos | — |
| `Goal` | Goal tracking | — |

## Seed Data

```typescript
// prisma/seed.ts

const defaultHabits = [
  { name: "Creatine", sortOrder: 0 },
  { name: "Vitamins", sortOrder: 1 },
  { name: "Stretching", sortOrder: 2 },
  { name: "Mobility", sortOrder: 3 },
  { name: "No Junk Food", sortOrder: 4 },
  { name: "Screen Off Before Bed", sortOrder: 5 },
];

const defaultGoals = [
  { name: "Target Weight", targetValue: 82, currentValue: 76.8, unit: "kg", type: "WEIGHT" },
  { name: "Daily Protein", targetValue: 160, currentValue: 0, unit: "g", type: "NUTRITION" },
  { name: "Daily Sleep", targetValue: 8, currentValue: 0, unit: "hours", type: "SLEEP" },
  { name: "Daily Steps", targetValue: 10000, currentValue: 0, unit: "steps", type: "STEPS" },
];

// 8-week program: same 5-day split repeated weekly
const programWorkouts = [
  {
    name: "Push",
    dayOfWeek: 1, // Monday
    exercises: [
      { name: "Push-ups", sets: 4, repRange: "10-20", restTime: 90 },
      { name: "Pike Push-ups", sets: 3, repRange: "8-12", restTime: 90 },
      { name: "Chair Dips", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Diamond Push-ups", sets: 3, repRange: "8-12", restTime: 90 },
    ],
  },
  {
    name: "Pull",
    dayOfWeek: 3, // Wednesday
    exercises: [
      { name: "Pull-ups", sets: 4, repRange: "6-12", restTime: 90 },
      { name: "Backpack Rows", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Reverse Fly", sets: 3, repRange: "12-15", restTime: 60 },
      { name: "Bicep Curls", sets: 3, repRange: "10-15", restTime: 60 },
    ],
  },
  {
    name: "Legs",
    dayOfWeek: 5, // Friday
    exercises: [
      { name: "Squats", sets: 4, repRange: "12-20", restTime: 90 },
      { name: "Bulgarian Split Squats", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Romanian Deadlift", sets: 3, repRange: "12-15", restTime: 90 },
      { name: "Calf Raises", sets: 4, repRange: "15-25", restTime: 60 },
    ],
  },
  {
    name: "Full Body",
    dayOfWeek: 6, // Saturday
    exercises: [
      { name: "Push-ups", sets: 3, repRange: "10-15", restTime: 60 },
      { name: "Pull-ups", sets: 3, repRange: "6-10", restTime: 60 },
      { name: "Squats", sets: 3, repRange: "15-20", restTime: 60 },
      { name: "Plank", sets: 3, repRange: "30-60s", restTime: 45 },
    ],
  },
];
```
