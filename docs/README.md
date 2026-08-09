# Somatix — Planning Docs

Personal body-transformation tracking application for an 8-week program.

## Philosophy

This is a **personal transformation operating system** with four loops:

1. **Plan** — What should I do today?
2. **Execute** — What did I actually do?
3. **Measure** — Am I improving?
4. **Adjust** — What should change?

Core value: *Open app → know exactly what to do → execute → record → see progress.*

## Documents

| Document | Contents |
|---|---|
| [architecture.md](./architecture.md) | Folder structure, tech stack decisions, system design |
| [database-schema.md](./database-schema.md) | Prisma schema, table relationships, seed data |
| [pages-and-routes.md](./pages-and-routes.md) | Route design, page structure, navigation flow |
| [api-design.md](./api-design.md) | Server actions, API routes, Zod validation schemas |
| [components.md](./components.md) | Component tree, ChatCM UI usage, server/client boundaries |
| [deployment.md](./deployment.md) | Docker setup, environment, deploy instructions |

## UX Approach

The app has two modes:

| Mode | Page | Purpose |
|---|---|---|
| **Today** (daily driver) | `/` | What should I do? Do it. Record it. |
| **Review** (weekly/monthly) | `/history` and others | How am I doing? What should change? |

The user opens the app and lands on **Today** — one page with workout, quick check-in, habits, and water/steps counters. No navigation required for daily use.

### Design Decisions

- **Progressive check-in**: 4 quick fields prominent (weight, sleep, energy, mood). Nutrition, notes, and details are expandable — not mandatory.
- **Post-workout prompt**: After completing a workout, an inline card asks for energy/soreness. Auto-saves to check-in. No separate navigation.
- **Habits inline**: Habits live only on the Today page (no separate `/habits` page for entry).
- **Auto-save on blur**: Quick check-in fields save automatically when the user moves to the next field. No "Save" button.
- **Water/steps counters**: Increment buttons (+250ml, +500ml) instead of a single text input.
- **Workout schedule auto-generates**: Calendar populated from program templates. Past dates never overwritten on template changes.

## Phases

### Phase 1 (MVP)
- Today page (workout card, quick check-in, habits, water/steps)
- Workout session execution (log sets, reps, weight, RPE + post-workout prompt)
- Workout program management (CRUD templates)
- Workout calendar (auto-schedule from templates)
- History page (weight, calories, protein, sleep trends)
- Profile (targets & baselines)
- Goals (target weight, pull-up target, sleep target, etc.)
- Weekly review (auto-summary)

### Phase 2
- Food database & meal logging (create food items, log meals, auto-calculate macros)
- Body measurements tracking
- Progress photo uploads

### Phase 3 (future)
- Multiple programs
- Program templates library
- Sharing/export
- Wearable integrations

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```
