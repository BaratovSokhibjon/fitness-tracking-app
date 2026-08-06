# Pages & Routes

## Mental Model

The app has two modes:

| Mode | Page | Purpose |
|---|---|---|
| **Today** (daily driver) | `/` | What should I do? Do it. Record it. |
| **Review** (weekly/monthly) | everything else | How am I doing? What should change? |

The user opens the app → lands on Today. Everything needed for *today* is on one page.

## Route Map

```
/                          → Today (workout, check-in, habits, water/steps)
/history                   → Charts, trends, past data (was the old dashboard)
/profile                   → Profile settings & targets
/program                   → Active program overview
/program/[programId]       → Edit program details
/program/workout/new       → Create new workout template
/program/workout/[id]      → Edit workout template exercises
/calendar                  → Monthly workout calendar
/workout/[scheduleId]      → Active workout session (log sets)
/workout/history           → Past completed workout sessions
/progress                  → Body measurements chart & form
/progress/photos           → Progress photo gallery
/review                    → Current/latest weekly review
/review/[weekNumber]       → Specific week's summary
/goals                     → Goal management
/foods                     → Food library (Phase 2)
```

Changes from previous design:
- `/` becomes **Today** (action page), not a read-only dashboard
- `/history` is the new trends/charts page (was `/` as dashboard)
- `/check-in` removed — check-in is part of Today
- `/check-in/[date]` removed — past check-ins are viewable from `/history` or `/review`
- `/login` removed — authentication is out of scope
- `/habits` removed — habits exist only on the Today page

## Navigation Structure

### Sidebar (persistent)
```
Today             /
History           /history
Calendar          /calendar
Program           /program
Progress          /progress
Review            /review
Goals             /goals
Foods             /foods       (Phase 2)
───
Profile           /profile
```

## Today Page (`/`) — The Core

This is the page the user interacts with **every day**. Everything needed for today lives here.

### Layout

```
┌─────────────────────────────────────────────┐
│ TODAY                          August 3     │
│                                             │
│ ┌─── TODAY'S WORKOUT ─────────────────────┐ │
│ │  Push                                          │ │
│ │  Push-ups 4×10-20, Pike Push-ups 3×8-12...     │ │
│ │  [Start Workout]                         │ │
│ │                                          │ │
│ │  Week progress: ████░░░░░ 2/5            │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ ┌─── QUICK CHECK-IN ───────────────────────┐ │
│ │  Morning weight  [76] kg [.8] (pre-filled)│ │
│ │                    ▲     ▲                 │ │
│ │                picker  picker              │ │
│ │                                          │ │
│ │  Sleep           [7.5 h]  ▼              │ │
│ │                  (3.0 – 15.0, 0.5 steps) │ │
│ │                                          │ │
│ │  Energy    ○○○○○●○○○○  7                  │ │
│ │  Mood      ○○○○○●○○○○  8                  │ │
│ │                                          │ │
│ │  ▶ Nutrition (food log)                  │ │
│ │  ▶ Activity (steps, water)               │ │
│ │  ▶ Notes                                 │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ ┌─── HABITS ───────────────────────────────┐ │
│ │  ☑ Creatine    ☐ Vitamins   ☐ Stretching │ │
│ │  ☐ Mobility    ☐ No junk    ☐ Screen off │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ ┌─── WATER ────────┐ ┌─── STEPS ──────────┐ │
│ │  💧 1.2L / 3L    │ │  👣 4,200 / 10,000 │ │
│ │  [+250ml] [+500ml]│ │  [+ steps]          │ │
│ └──────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Progressive Check-in

Only 4 fields are prominent when the page loads:

| Field | Input Type | Behavior |
|---|---|---|
| Morning weight | **Two-part picker** (kg + decimal) | Pre-filled from yesterday. Kg picker: 40–200 in 1kg steps. Decimal: .0–.9. Both are spinners or dropdowns — no keyboard. Auto-saves on change. |
| Sleep hours | **Slider or dropdown** | Range: 3.0–15.0 hours in 0.5 increments (3.0, 3.5, 4.0, ... 14.5, 15.0). Blank by default. Auto-saves on change. |
| Energy (1-10) | Slider or button group | Auto-saves on change. |
| Mood (1-10) | Slider or button group | Auto-saves on change. |

**Why pickers instead of free-text inputs:**
- Eliminates typos (no "768" instead of "76.8")
- No keyboard required — faster on mobile
- Constrains to reasonable values (nobody weighs 3kg or sleeps 22 hours)
- Pre-filling yesterday's weight + tap to adjust is faster than typing

Everything else is behind expandable sections (collapsed by default):
- **Nutrition** → food log (see Phase 2 below)
- **Activity** → steps, water (or use the increment counters)
- **Notes** → free text

### Workout Card

Two states:
1. **Not started** — Shows workout name + exercises summary + "Start Workout" button. Clicking navigates to `/workout/[scheduleId]`.
2. **Completed today** — Shows checkmark, duration, and a **post-workout prompt** inline.

### Post-Workout Prompt

After the user completes a workout and returns to Today (or the workout session completes):

```
┌─────────────────────────────────────────────┐
│ ✓ Workout completed — 45 min                │
│                                             │
│ How did it feel?                            │
│ Energy  ○○○○○●○○○○  7                       │
│ Soreness ○●○○○○○○○○  2                      │
│ Notes: [________________]                   │
│                                             │
│ [Save]                                      │
└─────────────────────────────────────────────┘
```

This auto-saves to the daily check-in. No separate navigation needed.

### Water / Steps Counters

Not a single input — they're increment counters. The user taps "+" to add. This matches the real-world behavior (drink water → log it; check step count → update it).

| Counter | Increment options |
|---|---|
| Water | +250ml, +500ml, custom |
| Steps | manual entry (typed) |

### Habits

Inline toggle grid, no separate page. The habits page is gone — there's no reason to leave Today for this.

---

## Phase 2: Food Database & Meal Logging

When the user expands the **Nutrition** section on Today, instead of manually typing calorie/protein/carb/fat numbers, they build a meal from a food database.

### Concept

The user maintains a library of food items. Each item has known macros per serving. When logging nutrition, the user adds items to today's food log — the macros auto-calculate.

```
┌─── NUTRITION (expanded) ───────────────────┐
│                                             │
│  Today's food log:                          │
│  ┌──────────────────────────────────────┐   │
│  │ 🍞 Bread (200g)    Cal 530  P 18g   │ ✕ │
│  │ 🥚 Eggs ×3         Cal 210  P 18g   │ ✕ │
│  │ 🍗 Chicken (150g)  Cal 250  P 46g   │ ✕ │
│  │ [+ Add food]                          │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Totals:  Cal 990  P 82g  C 45g  F 38g     │
│                                             │
│  vs targets:  Cal ████░░░░ 50%             │
│               P   █████░░░ 65%             │
└─────────────────────────────────────────────┘
```

### Food Item Properties

| Field | Description |
|---|---|
| Name | "Chicken breast", "White bread", "Eggs" |
| Serving size | "100g", "1 slice", "3 eggs" |
| Calories per serving | Number |
| Protein per serving | Grams |
| Carbs per serving | Grams |
| Fat per serving | Grams |
| Photo | Optional image of the food |
| Category | "Protein", "Carbs", "Fats", "Meal", "Snack" |

### User Flows

**Adding food to today's log:**
1. Expand Nutrition section
2. Tap [+ Add food]
3. Search or browse food library
4. Select item → adjust quantity (e.g., "×2" or "200g")
5. Item appears in today's log with calculated macros
6. Totals update automatically

**Managing food library:**
- `/foods` page — list of all food items with search/filter
- Create new food item (name, serving, macros, optional photo upload)
- Edit existing food item
- Delete unused food item (blocked if used in past logs to preserve history)

### Database (Phase 2 additions)

```
FoodItem
  - id
  - name
  - servingSize: float        // "100" (g)
  - servingUnit: string       // "g", "slice", "egg", "ml"
  - caloriesPerServing: int
  - proteinPerServing: float  // grams
  - carbsPerServing: float
  - fatPerServing: float
  - category: FoodCategory
  - imageUrl: string?
  - isActive: boolean

FoodLogEntry
  - id
  - checkInId → DailyCheckIn
  - foodItemId → FoodItem
  - quantity: float           // e.g., 2.0 (×2), 1.5 (150g of 100g serving)
  - calories: int             // denormalized: quantity × caloriesPerServing
  - protein: float            // denormalized
  - carbs: float              // denormalized
  - fat: float                // denormalized
```

### Seed Data (examples)

```typescript
const seedFoods = [
  { name: "White Bread", servingSize: 100, servingUnit: "g", caloriesPerServing: 265, proteinPerServing: 9, carbsPerServing: 49, fatPerServing: 3.2, category: "CARBS" },
  { name: "Eggs (whole)", servingSize: 1, servingUnit: "egg", caloriesPerServing: 70, proteinPerServing: 6, carbsPerServing: 0.6, fatPerServing: 5, category: "PROTEIN" },
  { name: "Chicken Breast", servingSize: 100, servingUnit: "g", caloriesPerServing: 165, proteinPerServing: 31, carbsPerServing: 0, fatPerServing: 3.6, category: "PROTEIN" },
  { name: "White Rice (cooked)", servingSize: 100, servingUnit: "g", caloriesPerServing: 130, proteinPerServing: 2.7, carbsPerServing: 28, fatPerServing: 0.3, category: "CARBS" },
  { name: "Banana", servingSize: 1, servingUnit: "medium", caloriesPerServing: 105, proteinPerServing: 1.3, carbsPerServing: 27, fatPerServing: 0.4, category: "SNACK" },
  { name: "Olive Oil", servingSize: 15, servingUnit: "ml", caloriesPerServing: 119, proteinPerServing: 0, carbsPerServing: 0, fatPerServing: 13.5, category: "FATS" },
  { name: "Greek Yogurt", servingSize: 100, servingUnit: "g", caloriesPerServing: 59, proteinPerServing: 10, carbsPerServing: 3.6, fatPerServing: 0.7, category: "PROTEIN" },
  { name: "Oats", servingSize: 100, servingUnit: "g", caloriesPerServing: 389, proteinPerServing: 17, carbsPerServing: 66, fatPerServing: 7, category: "CARBS" },
  { name: "Whey Protein", servingSize: 30, servingUnit: "g", caloriesPerServing: 120, proteinPerServing: 24, carbsPerServing: 3, fatPerServing: 1.5, category: "PROTEIN" },
  { name: "Peanut Butter", servingSize: 32, servingUnit: "g", caloriesPerServing: 190, proteinPerServing: 8, carbsPerServing: 6, fatPerServing: 16, category: "FATS" },
];
```


---

## History Page (`/history`)

The old dashboard. Charts and trends.

```
┌─────────────────────────────────────────────┐
│ Weight Trend (30 days)                      │
│ [line chart]                                │
│                                             │
│ Calories Trend (30 days)                    │
│ [bar chart]                                 │
│                                             │
│ Protein Trend (30 days)                     │
│ [bar chart]                                 │
│                                             │
│ Sleep Trend (30 days)                       │
│ [line chart]                                │
│                                             │
│ Workout Completion (by week)                │
│ [bar chart or calendar heatmap]             │
└─────────────────────────────────────────────┘
```

Purely read-only. Server component. No forms, no inputs.

---

## Other Pages (unchanged)

| Page | What it does |
|---|---|
| `/profile` | Edit targets (calories, protein, sleep, steps, water) |
| `/program/*` | Edit workout templates (add/remove exercises, change sets/reps) |
| `/calendar` | Monthly view. Click day to see workout details or start a workout |
| `/workout/[scheduleId]` | Active workout session. Log sets, reps, weight, RPE. After completion: post-workout prompt |
| `/workout/history` | List of past workout sessions |
| `/progress` | Body measurements form + line charts |
| `/progress/photos` | Photo gallery + upload |
| `/review` | Auto-generated weekly summary |
| `/goals` | CRUD for goals with progress bars |

---

## Data Flow — Today Page

### Server component fetches:

```typescript
const todayData = await getTodayData();
// Returns: {
//   todaySchedule: { workout, status },
//   weeklyProgress: { completed, total },
//   todayCheckIn: { weight, sleep, energy, mood, calories, protein, ... },
//   yesterdayWeight,  // for pre-filling
//   todayHabits: [{ habit, completed }],
//   todayWater: number,
//   todaySteps: number,
//   profile: { waterTarget, stepsTarget },
// }
```

### Client interactions (server actions):

| Action | Trigger |
|---|---|
| `saveQuickCheckIn` | User changes weight/sleep/energy/mood (auto-save on blur) |
| `saveNutrition` | User expands nutrition section and fills fields |
| `toggleHabit` | User checks/unchecks a habit checkbox |
| `incrementWater` | User taps +250ml or +500ml |
| `updateSteps` | User types new step count |
| `savePostWorkout` | User fills post-workout prompt after completing workout |

### Auto-save behavior

Quick check-in fields (weight, sleep, energy, mood) auto-save on blur. No "Save" button needed. The user just fills and moves on. This eliminates the "I forgot to hit save" problem.
