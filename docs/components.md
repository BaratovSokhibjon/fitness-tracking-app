# Component Structure

## Principle

Use **ChatCM UI pre-built components only**. Do not create custom UI primitives (buttons, inputs, modals, tables, etc.) if ChatCM UI provides them. Custom components are limited to composing ChatCM UI components together.

## Component Tree

```
<Shell>                              # Root layout wrapper
├── <Sidebar>                        # Persistent left navigation
│   ├── Logo
│   └── Nav items (links to each route)
│
└── <main>
    └── {page content}

# Today (/)
<TodayPage>                          # Server component — fetches all data
├── <WorkoutCard>                    # Today's planned workout
│   ├── State: planned → shows name, exercises preview, [Start Workout]
│   └── State: completed → shows ✓, duration, triggers PostWorkoutPrompt
│
├── <QuickCheckIn>                   # Progressive check-in form
│   ├── Morning weight: [kg picker] [.decimal picker]
│   │   (pre-filled from yesterday, 40–200 kg, .0–.9 decimal)
│   ├── Sleep hours (dropdown/slider, 3.0–15.0 in 0.5 steps)
│   ├── Energy (Slider or ButtonGroup, 1-10)
│   ├── Mood (Slider or ButtonGroup, 1-10)
│   └── <ExpandableSection>          # Collapsed by default
│       ├── <NutritionSection>       # Phase 1: manual input; Phase 2: food log
│       │   └── <FoodSelector />     # Phase 2: search/browse food items
│       └── <NotesSection>           # Textarea
│
├── <HabitGrid>                      # Today's habits
│   └── <HabitToggle>                # Checkbox + habit name
│
├── <WaterCounter>                   # Increment counter
│   └── [+250ml] [+500ml] [custom]
│
├── <StepsCounter>                   # Manual entry
│   └── Input with current value
│
└── <PostWorkoutPrompt>              # Appears after workout completes
    ├── Energy (1-10)
    ├── Soreness (1-10)
    └── Notes (optional)
    └── [Save] → auto-saves to today's check-in

# History (/history)
<HistoryPage>                        # Server component
├── <WeightChart />                  # 30-day line chart
├── <CaloriesChart />                # 30-day bar chart
├── <ProteinChart />                 # 30-day bar chart
├── <SleepChart />                   # 30-day line chart
└── <WorkoutCompletionChart />       # Weekly bar chart or calendar heatmap

# Workout Session (/workout/[scheduleId])
<WorkoutSessionPage>                 # Client component
├── <WorkoutHeader>                  # Workout name, date, duration timer
├── <ExerciseList>
│   └── <ExerciseLog>               # Per exercise, expandable
│       ├── Exercise name, target sets × reps
│       └── <SetRow>                 # Per set: reps input, weight input, RPE select
│           ├── Set number
│           ├── Reps (Input, number)
│           ├── Weight (Input, number)
│           └── RPE (Select, 1-10)
└── <CompleteButton>                 # Triggers save + redirect to Today
    └── On complete: redirect to / with PostWorkoutPrompt visible

# Calendar (/calendar)
<CalendarPage>
└── <WorkoutCalendar>                # ChatCM UI Calendar with color-coded days
    └── <DayDetail>                  # Dialog on day click

# Program Editor (/program/*)
<ProgramPage>
├── <ProgramEditor>                  # Name, description, duration
├── <WorkoutForm>                    # Add/edit workout template
│   └── <ExerciseForm>               # Add/edit exercises within workout
└── <ProgramActions>                 # Activate/deactivate

# Progress (/progress)
<ProgressPage>
└── <Tabs>                           # Measurements / Photos
    ├── Measurements tab
    │   ├── <MeasurementForm>        # Date + body part inputs
    │   └── <MeasurementChart>       # Line chart per measurement
    └── Photos tab
        └── <PhotoGallery>           # Grid of photos by date
            └── <PhotoUpload>        # Drag/drop or file input

# Weekly Review (/review)
<ReviewPage>
├── <WeeklySummary>                  # Auto-calculated stats
└── <NotesEditor>                    # Textarea for notes

# Goals (/goals)
<GoalsPage>
└── <GoalList>
    └── <GoalCard>                   # Name, progress bar, edit/delete

# Foods (/foods) — Phase 2
<FoodsPage>
├── <FoodSearch />                   # Search/filter bar
├── <FoodList>
│   └── <FoodCard>                   # Name, serving, macros, photo, edit/delete
└── <FoodForm>                       # Dialog: create/edit food item
    ├── Name, serving size, unit
    ├── Calories, protein, carbs, fat per serving
    ├── Category dropdown
    └── Photo upload

# Workout History (/workout/history)
<WorkoutHistoryPage>                 # Server component
└── <SessionList>
    └── <SessionCard>                # Date, workout name, duration, exercises summary

# Profile (/profile)
<ProfilePage>                        # Client component
└── <ProfileForm>                    # React Hook Form
    ├── Height, age, program start date
    └── Daily targets: calories, protein, carbs, fat, water, steps, sleep
```

## Server vs. Client Components

| Component | Type | Reason |
|---|---|---|
| `TodayPage` | Server (wrapper) | Fetches all today data, passes to client children |
| `WorkoutCard` | Client | Has state (planned/completed), Start button |
| `QuickCheckIn` | Client | Form state, auto-save on blur |
| `HabitGrid` / `HabitToggle` | Client | Interactive checkboxes, optimistically updates |
| `WaterCounter` | Client | Increment button interaction |
| `StepsCounter` | Client | Input interaction |
| `FoodSelector` | Client | Search/browse food items (Phase 2) |
| `FoodForm` | Client | Create/edit food item (Phase 2) |
| `PostWorkoutPrompt` | Client | Form with save action |
| `HistoryPage` | Server | Fetches all chart data |
| Charts (weight, calories, etc.) | Client | Recharts requires client-side rendering |
| `WorkoutSession` | Client | Real-time set logging, form state |
| `SetRow` | Client | Input fields for reps/weight/RPE |
| `WorkoutCalendar` | Client | ChatCM UI Calendar is interactive |
| `ProgramEditor` | Client | Form state for editing |
| `MeasurementForm` | Client | Form inputs |
| `PhotoUpload` | Client | File input + preview |
| `GoalForm` / `GoalCard` | Client | Add/edit dialog form |
| `SessionList` / `SessionCard` | Server | Read-only, fetched from DB |
| `ProfileForm` | Client | Form inputs for targets |
| `WeeklySummary` | Server | Read-only, fetches and displays |
| `Sidebar` | Client | Active route highlighting |

## Auto-Save Behavior

Key interactions on the Today page use auto-save (no explicit save button):

| Component | Trigger | Action |
|---|---|---|
| `QuickCheckIn` fields | onBlur | `saveQuickCheckIn({ weight, sleep, energy, mood })` |
| `HabitToggle` | onChange | `toggleHabit({ habitId, date, completed })` |
| `WaterCounter` | onClick (+250ml, +500ml) | `incrementWater({ amount })` |
| `StepsCounter` | onBlur | `updateSteps({ steps })` |
| `PostWorkoutPrompt` | onClick Save | `savePostWorkout({ energy, soreness, notes })` |

This eliminates "forgot to save" — the user just uses the page and data persists.

## ChatCM UI Components Used

Only reference ChatCM UI components. Do not create custom:

- **Layout**: Sidebar, Container, Grid, Flexbox
- **Navigation**: Nav, Tabs
- **Data display**: Card, Table, Badge, Progress, Statistic
- **Forms**: Input, Select, Textarea, Checkbox, Radio, Slider, ButtonGroup, DatePicker
- **Feedback**: Dialog, Toast, Popover, Tooltip
- **Charts**: LineChart, BarChart (wrapper around Recharts)
- **Calendar**: Calendar, CalendarDay
- **Buttons**: Button, IconButton
- **Typography**: Heading, Text

If a ChatCM UI component doesn't exist for a specific need, compose existing ones rather than building custom.
