# Architecture

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, server actions, file-based routing |
| Language | TypeScript (strict) | Type safety across client/server boundary |
| Styling | Tailwind CSS | Utility-first, pairs with ChatCM UI |
| UI Components | ChatCM UI (pre-built only) | No custom components — use library for consistency |
| Database | MySQL 8 | Relational, production-ready |
| ORM | Prisma | Type-safe queries, migrations, seeding |
| Forms | React Hook Form + Zod | Client validation + server validation from same schemas |
| Charts | Recharts (via ChatCM UI) | Dashboard charts from pre-built components |
| Calendar | ChatCM UI Calendar | Workout schedule display |

## Project Folder Structure

```
somatix/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (sidebar, shell)
│   │   ├── page.tsx                  # Today (workout, check-in, habits)
│   │   ├── loading.tsx               # Today loading skeleton
│   │   │
│   │   ├── history/
│   │   │   └── page.tsx              # Charts, trends, past data
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx              # Profile + goals
│   │   │
│   │   ├── program/
│   │   │   ├── page.tsx              # Program overview
│   │   │   ├── workout/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create workout template
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Edit workout template
│   │   │   └── [programId]/
│   │   │       └── page.tsx          # Edit program
│   │   │
│   │   ├── calendar/
│   │   │   └── page.tsx              # Monthly/weekly workout calendar
│   │   │
│   │   ├── workout/
│   │   │   ├── [scheduleId]/
│   │   │   │   └── page.tsx          # Active workout session
│   │   │   └── history/
│   │   │       └── page.tsx          # Past workout sessions list
│   │   │
│   │   ├── progress/
│   │   │   ├── page.tsx              # Measurements chart
│   │   │   └── photos/
│   │   │       └── page.tsx          # Photo gallery
│   │   │
│   │   ├── review/
│   │   │   ├── page.tsx              # Current/latest weekly review
│   │   │   └── [weekNumber]/
│   │   │       └── page.tsx          # Specific week review
│   │   │
│   │   └── api/
│   │       └── upload/
│   │           └── route.ts          # Photo upload endpoint
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   └── utils.ts                  # Shared helpers (date math, averages)
│   │
│   ├── actions/                      # Server actions
│   │   ├── profile.ts
│   │   ├── check-in.ts
│   │   ├── program.ts
│   │   ├── workout.ts
│   │   ├── schedule.ts
│   │   ├── session.ts
│   │   ├── progress.ts
│   │   ├── habits.ts
│   │   ├── goals.ts
│   │   └── review.ts
│   │
│   ├── schemas/                      # Zod validation schemas
│   │   ├── profile.ts
│   │   ├── check-in.ts
│   │   ├── program.ts
│   │   ├── workout.ts
│   │   ├── session.ts
│   │   ├── measurement.ts
│   │   ├── habit.ts
│   │   └── goal.ts
│   │
│   ├── queries/                      # Reusable database queries
│   │   ├── today.ts
│   │   ├── history.ts
│   │   ├── calendar.ts
│   │   ├── program.ts
│   │   └── review.ts
│   │
│   └── components/                   # React components
│       ├── layout/
│       │   ├── sidebar.tsx
│       │   ├── topbar.tsx
│       │   └── shell.tsx
│       │
│       ├── today/
│       │   ├── workout-card.tsx
│       │   ├── quick-check-in.tsx
│       │   ├── nutrition-section.tsx
│       │   ├── habit-grid.tsx
│       │   ├── water-counter.tsx
│       │   ├── steps-counter.tsx
│       │   └── post-workout-prompt.tsx
│       │
│       ├── history/
│       │   ├── weight-chart.tsx
│       │   ├── calories-chart.tsx
│       │   ├── protein-chart.tsx
│       │   ├── sleep-chart.tsx
│       │   └── workout-completion-chart.tsx
│       │
│       ├── program/
│       │   ├── program-editor.tsx
│       │   ├── workout-form.tsx
│       │   └── exercise-form.tsx
│       │
│       ├── calendar/
│       │   └── workout-calendar.tsx
│       │
│       ├── workout/
│       │   ├── workout-session.tsx
│       │   ├── exercise-log.tsx
│       │   └── set-row.tsx
│       │
│       ├── progress/
│       │   ├── measurement-form.tsx
│       │   ├── measurement-chart.tsx
│       │   └── photo-upload.tsx
│       │
│       ├── review/
│       │   └── weekly-summary.tsx
│       │
│       └── goals/
│           ├── goal-card.tsx
│           └── goal-form.tsx
│
├── public/
│   └── uploads/                      # User-uploaded photos
│
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── docs/                             # Planning docs (this folder)
```

## Key Architecture Decisions

### 1. Templates vs. History

**Workout templates** define the program (exercises, sets, rep ranges).
**Workout sessions** record what actually happened (actual reps, weight, RPE).

These are separate tables and never mix. Changing exercises in a template does not affect historical session logs. Changing future schedule entries regenerates from templates; past entries are immutable.

### 2. Schedule Generation

The calendar is populated by a schedule generator that reads workout templates and creates `WorkoutSchedule` records for each date. Schedule generation is triggered:
- When a new program is created or activated
- When the user navigates to the calendar view (idempotent — only fills missing dates)
- When a program template is edited (only affects future dates, not past)

### 3. Server vs. Client Components

| Component Type | Examples | Rendering |
|---|---|---|
| Server Components | History page, weekly review, program overview | Server-rendered |
| Client Components | Today page, forms, workout session, counters | Client-rendered with `"use client"` |

Server components fetch data directly. Client components receive initial data via server component props and call server actions for mutations.

### 3a. Auto-Save Pattern (Today Page)

Quick check-in fields (weight, sleep, energy, mood) auto-save on blur via server actions. No explicit "Save" button. This avoids the "forgot to save" problem on the most-used page.

Water and steps use increment counters: each tap calls a server action that adds to the current value. This matches real-world behavior (drink → log, check steps → update).

### 4. Server Actions for Mutations

All data mutations use Next.js Server Actions (no REST API needed for CRUD). The only API route is:
- File uploads (`/api/upload`)

### 5. Validation

Validation happens twice:
- **Client**: React Hook Form + Zod (instant feedback)
- **Server**: Same Zod schemas reused in server actions (security boundary)

### 6. Database Access

- Server components call query functions in `src/queries/` directly (they're server-only)
- Server actions in `src/actions/` use Prisma client from `src/lib/prisma.ts`
- Client components never access the database directly
- `"server-only"` package prevents accidental client-side database imports
