# Mobile App Plan (Somatix)

> **Plan active from:** 2026-08-10 (KST)
>
> **Status:** Approved plan — pending implementation
>
> **Decisions locked in this plan:**
> - Framework: **React Native (Expo, managed workflow)** — shares React/TypeScript skills with the web app
> - Backend: **Separate REST API (Hono)** — mobile cannot call Next.js server actions directly
> - Mobile v1 scope: **Essentials & quick actions only** — workout card is read-only on mobile
> - Offline: **SQLite + custom sync** (optimistic writes, queue, pull on reconnect)
> - Auth: **HTTP Basic (email + password)** — single self-hosted user for now, schema leaves room for multi-user later
> - Notifications: **Advanced configurable reminders** — user sets time + what to track (e.g. "remind me at 05:00 to log body weight")
> - Deployment: **Dockerized** via compose.yml (user handles the rest)

---

## 1. Architecture Overview

```
docker-compose.yml
├── mysql          (existing)
├── web            (existing Next.js app, port 3000)
└── api            (new Hono REST API, port 4000)
        │
        └── React Native mobile app (Expo) → REST API → MySQL
```

- The **web app stays as-is** (server actions keep working for the browser).
- The **REST API is a new standalone service** that shares the Prisma client and zod schemas.
- The **mobile app talks only to the REST API**, never directly to the web app's server actions.

---

## 2. Database Changes (multi-user auth)

### 2.1 New `User` model

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  profile      Profile?
  deviceTokens DeviceToken[]
  reminders    Reminder[]
}
```

### 2.2 Add `userId` to scoped models

Ensures multi-user isolation from day one. Existing single-user data is migrated to a seeded default user.

| Model | Change | Unique constraint becomes |
|---|---|---|
| `Profile` | add `userId String @unique` | — |
| `DailyCheckIn` | add `userId String` | `@@unique([userId, date])` |
| `CreatineLog` | add `userId String` | `@@unique([userId, date])` |
| `BodyMeasurement` | add `userId String` | `@@unique([userId, date])` |
| `Program` | add `userId String` | — |
| `MealTemplate` | add `userId String` | — |
| `Goal` | add `userId String` | — |

> **Note:** `Habit` (definitions) stays global — habits are a shared concept. **But `HabitLog` must be scoped**: its `@@unique([habitId, date])` would collide across users (user A and B toggling the same habit on the same date → P2002). Add `userId` to `HabitLog` with `@@unique([userId, habitId, date])`. Similarly `MealTemplate` needs `@@unique([userId, name])` (was `@@unique([name])`), and `WorkoutSchedule`/`WorkoutSession`/`ExerciseLog` are a scope decision — see §2.4.

### 2.3 New models for notifications

```prisma
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  platform  String   // "ios" | "android"
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Reminder {
  id        String   @id @default(cuid())
  userId    String
  time      String   // "05:00" — local time the user configured
  timezone  String   // IANA tz, e.g. "Asia/Seoul" — per user (or per reminder); see review finding R6
  days      String   // JSON array ["Mon","Tue",...]
  type      String   // "body_weight" | "food_log" | "water" | "creatine" | "caffeine" | "habits" | "sleep" | "steps"
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 2.4 Migration sequence (critical — Prisma cannot backfill)

`prisma migrate dev` alone **cannot** add required `userId` columns to non-empty tables (MySQL 8 strict mode fails on `ADD COLUMN userId VARCHAR(191) NOT NULL`). The migration MUST be a four-step sequence:

1. **Add nullable**: migrate adding `userId String?` to all scoped models (DailyCheckIn, CreatineLog, BodyMeasurement, Program, MealTemplate, Goal, HabitLog, and — decision pending — WorkoutSchedule/WorkoutSession/ExerciseLog).
2. **Create the seed User**: insert the default user row (fixed id, seeded from env: `SEED_EMAIL`/`SEED_PASSWORD`).
3. **Backfill**: raw SQL `UPDATE <table> SET userId = '<seed-user>'` for every table — hand-edited into the migration SQL (`--create-only` + edit) or via `prisma db execute` between migrations.
4. **Tighten**: migrate to `NOT NULL`, swap unique indexes (`date` → `[userId, date]`).

Also required in this phase:
- **Seed ordering fix**: `prisma/seed.ts` currently upserts Profile before any User exists — once Profile.userId is required the seed breaks (FK violation). Create User first, then profile.
- **Web app refactor (unavoidable, ~10 files)**: changing `@@unique([date])` → `@@unique([userId, date])` breaks Prisma's generated `where: { date }` types at compile time. Every `findUnique`/`upsert` on these models must switch to the composite key. Affected: `actions/check-in.ts`, `actions/water-steps.ts`, `actions/foods.ts`, `actions/schedule.ts`, `actions/creatine.ts`, `actions/session.ts`, `queries/today.ts`, `queries/calendar.ts`, `queries/history.ts`, `queries/records.ts`, `queries/dashboard.ts`, `actions/review.ts`, `actions/progress.ts`. Profile's hardcoded `"default-profile"` id (actions/profile.ts, actions/creatine.ts) must pass `userId` in its create branch. Additionally, `findFirst()` calls on Profile/Program must be scoped by userId or they return arbitrary rows once a second user exists.

### 2.5 Workout calendar scoping — decide now

`WorkoutSchedule` has `@@unique([date])` and the whole execution chain (`WorkoutSession` → `ExerciseLog`) hangs off it. Without scoping, a second user's `generateSchedule` **mutates the first user's rows** (schedule.ts update branch) and same-date rows collide.

**Decision required (default recommendation): add `userId` to WorkoutSchedule, WorkoutSession, and ExerciseLog now.** It is cheap now (part of the same 4-step migration) and the single most expensive retrofit later (past entries must not be overwritten — schedule.ts explicitly honors that). Alternatively explicitly frame v1 as single-user and drop the "isolation from day one" claim for the calendar — but the half-measure of auth + unscoped calendar gives the worst of both.

---

## 3. REST API (Hono, port 4000)

### 3.1 Project layout

```
packages/api/            # (or apps/api — TBD monorepo vs separate package)
├── src/
│   ├── index.ts             # Hono app entry
│   ├── middleware/
│   │   └── auth.ts          # HTTP Basic auth middleware (verify fn: User lookup + bcryptjs)
│   ├── routes/
│   │   ├── auth.ts          # GET /auth/verify (validate Basic creds)
│   │   ├── check-in.ts      # quick check-in, weight/sleep/energy/mood
│   │   ├── foods.ts         # search + log + remove
│   │   ├── habits.ts        # list + toggle
│   │   ├── counters.ts      # water / steps / caffeine increments
│   │   ├── creatine.ts      # phase + toggle dose
│   │   ├── schedule.ts      # today's workout (read-only)
│   │   ├── profile.ts       # targets
│   │   ├── reminders.ts     # CRUD
│   │   └── sync.ts          # bulk push/pull
│   ├── services/
│   │   └── notifications.ts # Expo push sender + cron scheduler
│   └── lib/
│       ├── prisma.ts        # PrismaClient singleton
│       └── auth.ts          # Basic auth helpers (header parse, verify fn)
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 3.2 Endpoints (mobile v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/verify` | validate Basic credentials → `{ email }` (used by mobile on login/startup) |
| GET | `/check-in?date=` | check-in for a date (weight/sleep/energy/mood/water/steps/caffeine) |
| POST | `/check-in/quick` | save weight, sleep, energy, mood |
| GET | `/foods/search?q=` | search food library |
| POST | `/foods/log` | add food to date's log |
| DELETE | `/foods/log/:id` | remove food entry |
| GET | `/foods/log?date=` | food log entries for a date |
| POST | `/water` | `{ amount }` → increment |
| POST | `/steps` | `{ steps }` → set |
| POST | `/caffeine` | `{ amount }` → increment |
| GET | `/habits?date=` | habits with today's completion |
| POST | `/habits/toggle` | `{ habitId, completed }` |
| GET | `/creatine` | phase, day, dose, streak |
| POST | `/creatine/toggle` | mark dose taken |
| GET | `/schedule/today` | today's workout (read-only: name, exercises, sets×reps, weeklyProgress) |
| GET | `/profile` | targets + program config |
| PUT | `/profile` | update targets |
| POST | `/devices` | register Expo push token (upsert token + platform) — required for notifications |
| DELETE | `/devices/:token` | unregister device token |
| GET | `/reminders` | user's reminder rules |
| POST | `/reminders` | create reminder rule |
| PUT | `/reminders/:id` | update reminder rule |
| DELETE | `/reminders/:id` | remove reminder rule |
| POST | `/sync` | push local changes + pull server changes (bulk) |

### 3.3 Auth

- **Decided 2026-08-10 (updated): Basic Authentication** (HTTP Basic) instead of JWT.
  - Single user seeded from env (`SEED_EMAIL`/`SEED_PASSWORD`) on first boot — **no public register route**.
  - Every request carries `Authorization: Basic base64(email:password)`.
  - Hono built-in `basicAuth` middleware with a verify function: look up email in `User`, `bcryptjs.compare` the password. Works unchanged for N users later.
  - **Hard requirement: TLS termination in front of the API** (Caddy / Tailscale / Cloudflare Tunnel / reverse proxy). Basic sends credentials (base64, not encrypted) on every request — plain HTTP on a shared network is unacceptable.
  - Mitigations: failed-login rate limiting per IP; password change is the revocation mechanism.
  - Mobile stores email + password in `expo-secure-store`, attaches the header via a fetch wrapper. No token expiry → no re-auth/refresh flow → simpler offline sync.
- Password hashing: **bcryptjs** (pure JS — no node-gyp build deps on alpine).

### 3.4 Notification engine

- Cron job (e.g. `node-cron`) runs every minute.
- Queries `Reminder` rows where current HH:MM matches `reminder.time` and today's weekday is in `reminder.days`, and `enabled = true`.
- Sends Expo push notification via `expo-server-sdk` to the user's `DeviceToken` rows.
- Notification payload includes a deep link to the relevant screen (e.g. `somatix://today`).

---

## 4. React Native App (Expo)

### 4.1 Project layout

```
mobile/
├── app/                     # expo-router file-based routes
│   ├── _layout.tsx          # root layout (auth gate, theme provider)
│   ├── index.tsx            # Today screen
│   ├── auth/
│   │   ├── login.tsx        # email + password → stores creds in secure storage, GET /auth/verify
│   │   └── register.tsx
│   ├── profile.tsx          # targets (read-only for v1)
│   ├── reminders.tsx        # reminder list + CRUD
│   └── settings.tsx         # theme, logout
├── src/
│   ├── components/
│   │   ├── QuickCheckIn.tsx     # weight/sleep/energy/mood
│   │   ├── WorkoutCard.tsx      # read-only today's workout
│   │   ├── FoodLog.tsx          # entries + search + add
│   │   ├── CounterCard.tsx      # generic water/steps/caffeine/creatine card
│   │   ├── HabitGrid.tsx        # habit toggles
│   │   └── ReminderForm.tsx     # time picker + day toggles + type selector
│   ├── db/
│   │   ├── schema.ts        # SQLite table definitions
│   │   ├── mutations.ts     # local write helpers (optimistic)
│   │   └── sync.ts          # queue outgoing, pull incoming
│   ├── api/
│   │   └── client.ts        # typed fetch wrapper around the REST API
│   ├── hooks/
│   │   ├── useAuth.ts       # creds state + secure storage (email/password, not tokens)
│   │   └── useSync.ts       # background sync effect
│   └── notifications/
│       └── register.ts      # expo push token registration
├── app.json
├── package.json
└── tsconfig.json
```

### 4.2 Screens (mobile v1)

| Screen | Content |
|---|---|
| **Today** | ScrollView: read-only workout card → quick check-in (weight/sleep/energy/mood) → food log (search + add + list) → habit toggles → counter strip (water/steps/caffeine/creatine) |
| **Auth** | Login + register (email + password) |
| **Profile** | Read-only targets (age, height, start date, all daily targets) |
| **Reminders** | List + add/edit/delete reminder rules: time picker, day-of-week toggles, type dropdown, enable switch |
| **Settings** | Theme toggle, logout |

### 4.3 Not in mobile v1 (web-only)

- Full workout session (set-by-set logging with RPE, rest timer, warm-up calculator)
- Calendar view
- Dashboard / analytics
- Program editor
- Body measurements entry
- Goals CRUD
- Progress photos

### 4.4 Offline sync strategy

**Design correction (from second-opinion review): plain "LWW on updatedAt" is NOT implementable as first written.** Required fixes:

1. **Missing `updatedAt` columns**: `FoodLogEntry`, `HabitLog`, and `CreatineLog` have no `updatedAt` — they must be added, or these tables get createdAt-based merge semantics.
2. **Derived-totals clobbering (the dangerous one)**: `DailyCheckIn.calories/protein/carbs/fat` are recomputed server-side from `FoodLogEntry` (foods.ts `recomputeCheckInTotals`). A mobile push of a stale cached row can overwrite server-computed totals back to 0. Fix: **exclude derived columns from mobile writes** — mobile never writes calories/protein/carbs/fat; the API recomputes totals after every food-log push.
3. **Deletes have no tombstone in LWW**: `removeFoodFromLog` is a hard delete. Fix: pull = "since-last-sync watermark + full replace of affected rows"; push = replay of an **idempotent op queue** (not row LWW).

**Concrete sync model:**
- **Reads**: fetch from API → cache to SQLite → show cached instantly → background refresh. Pull is **unconditional** on foreground/15-min tick and replaces all rows newer than the watermark — including rows the user didn't touch on mobile (web writes directly via server actions; the mobile cache is never source of truth for server-touched rows).
- **Writes**: write to SQLite immediately (optimistic) → enqueue idempotent op to `pending_sync` table → flush to API when online → on success, pull affected rows back.
- **Conflict resolution**: last-write-wins per row via `updatedAt`, EXCEPT derived columns (never written by mobile) and delete/insert ops (handled via the op queue + watermark pull).
- **Sync triggers**: app foreground, after each mutation, periodic background fetch (~15 min).

### 4.5 Design system

The Quiet Data Ledger translates to React Native via a minimal token set in a `ThemeProvider`:
- Colors: ink / canvas / linen / cloud / hairline / mute / stone / success (same values as web)
- Typography: Inter (system fallback) + JetBrains Mono for numerals
- Shapes: sharp corners (0 radius), hairline borders, no shadows
- No heavy UI library — native components with style objects matching the web's Tailwind tokens

---

## 5. Docker

The repo already has `docker-compose.yml` with services **`app`** (web, port 3000) and **`db`** (mysql:8.0) — keep those names; the api service extends the existing file, not renames it:

```yaml
# docker-compose.yml (extends existing app + db services)
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports: ["4000:4000"]
    depends_on:
      db:
        condition: service_healthy        # match the app service pattern
    env_file: .env                        # DATABASE_URL + SEED_EMAIL/SEED_PASSWORD live here — do NOT inline them
    environment:
      TZ: Asia/Seoul                      # critical: compose containers default to UTC; the reminder
                                          # cron "05:00" would otherwise fire at 05:00 UTC = 14:00 KST
```

**Prisma in the api image**: the web Dockerfile relies on root `postinstall: prisma generate` and Next `standalone` output. A separate api package must (a) pin the **same Prisma version (6.5.0)** as the web app, (b) copy `prisma/` and run `prisma generate` in its own build step. **Decide monorepo vs single-package before Phase 4** — for this repo size, keeping the API inside the same package/dependency tree with a second Dockerfile is the simplest path.

**Who runs migrations**: neither the web CMD (`node server.js`) nor the api entrypoint migrates at boot. Decide explicitly: one-shot `prisma db deploy` in a compose init step, or in the api entrypoint — otherwise both images drift on schema.

**Password hashing**: use **`bcryptjs`** (pure JS). Native `bcrypt`/`argon2` need node-gyp build deps on `node:22-alpine` (python/make) — not worth it for this threat model.

**API base URL for the phone**: self-hosted users need the host's LAN IP or domain baked into the mobile build (or an in-app settings field) — the most common Expo self-hosted tripwire; put it in the mobile config.

---

## 6. Implementation Order

```
Phase 0: Decision gate — ALL DECIDED 2026-08-10 (user + review)
  - Workout calendar scoping: SCOPE NOW — add userId to WorkoutSchedule/Session/ExerciseLog (§2.5)
  - API packaging: SINGLE PACKAGE — same dependency tree, second Dockerfile (§5)
  - Expo SDK: latest stable at implementation time
  - Push delivery: Expo push service (expo-server-sdk)
  - Web app ↔ API: parallel, unify later
  - Phone → API base URL: in-app settings field
  - Registration: seed single user from env (SEED_EMAIL/SEED_PASSWORD), NO public /auth/register

Phase 1: Database (4-step migration — §2.4)
  - Add User model + DeviceToken + Reminder (with timezone)
  - Add nullable userId → seed User → backfill SQL → tighten NOT NULL + swap uniques
  - Scope: DailyCheckIn, CreatineLog, BodyMeasurement, Program, MealTemplate, Goal, HabitLog, WorkoutSchedule, WorkoutSession, ExerciseLog
  - Fix seed ordering (User before Profile)
  - Web app refactor pass (~10 files: composite-key where clauses, Profile userId, userId-scoped findFirst)

Phase 2: Hono REST API
  - Auth routes (HTTP Basic; seed user from env; GET /auth/verify; failed-login rate limiting)
  - All CRUD endpoints + /devices (push token registration)
  - Sync endpoint (idempotent op queue + watermark pull; derived columns excluded from mobile writes)
  - Notification cron + Expo push service (TZ-aware, prune dead device tokens)

Phase 3: React Native app
  - Expo project + expo-router + auth gate + in-app API base URL settings field
  - SQLite schema + sync engine (op queue, not row LWW)
  - Today screen (all quick-action components)
  - Reminders screen + notification registration (Android 13 POST_NOTIFICATIONS permission)
  - bcryptjs auth on server

Phase 4: Docker + integration
  - Dockerfile.api (own prisma generate) + extend existing docker-compose.yml (app/db names)
  - Migration run strategy (compose init step)
  - End-to-end test: mobile → API → MySQL → web
```

---

## 7. Open Questions — ALL RESOLVED (2026-08-10)

1. ~~Monorepo vs single-package~~ → **decided: single package** (same dependency tree, second Dockerfile).
2. ~~bcrypt vs argon2~~ → **decided: bcryptjs** (pure JS, alpine-friendly).
3. ~~Reminder timezone~~ → **decided: IANA timezone per user/reminder + `TZ: Asia/Seoul` in compose** (UTC container default is a real bug, not a design question).
4. ~~Expo SDK + push delivery~~ → **decided: latest stable SDK at implementation time; Expo push service** (expo-server-sdk).
5. ~~Web app unification~~ → **decided: parallel for now** (web keeps server actions; mobile uses REST API; unify later if desired).
6. ~~Workout calendar scoping~~ → **decided: scope now** — add userId to WorkoutSchedule/WorkoutSession/ExerciseLog (§2.5).
7. ~~API base URL for the phone~~ → **decided: in-app settings field** (user types LAN IP/domain; no rebuild on network change).
8. ~~Registration policy~~ → **decided: seed single user from env (SEED_EMAIL/SEED_PASSWORD); NO public register route**.
9. ~~JWT vs Basic~~ → **decided (2026-08-10, user request): HTTP Basic Authentication** — no JWT, no refresh flow; TLS termination required in front of the API; failed-login rate limiting; password change = revocation.

---

## 8. Second-Opinion Review (2026-08-10)

Independent review of this plan performed via subagent on 2026-08-10. Verdict: **architecture direction (Expo + Hono + SQLite sync) is sound**; the plan's original wording contained several factual errors that have been corrected inline in the sections above. Full findings, by severity:

### Critical (corrected in the plan)

| # | Finding | Resolution |
|---|---|---|
| R1 | `prisma migrate dev` cannot backfill required `userId` columns — MySQL strict mode fails. Plan glossed over the sequence. | §2.4: explicit 4-step migration (nullable → seed User → backfill SQL → tighten + swap uniques). |
| R2 | "The web app stays as-is" was false. `@@unique([date])` → `@@unique([userId, date])` breaks Prisma's generated `where: { date }` types at compile time — ~30 call sites across ~13 files, plus Profile's hardcoded `"default-profile"` id and unscoped `findFirst()` calls. | §2.4: web refactor pass is budgeted in Phase 1 (~10 files). |
| R3 | HabitLog `@@unique([habitId, date])` collides across users; the plan's "scoped via its date relation" note was wrong. | §2.2 note corrected: add `userId` to HabitLog, `@@unique([userId, habitId, date])`. |
| R4 | Sync "LWW on updatedAt" unimplementable as written: FoodLogEntry/HabitLog/CreatineLog lack `updatedAt`; DailyCheckIn derived totals (calories/P/C/F) get clobbered by stale mobile pushes; hard deletes have no tombstone. | §4.4 rewritten: op queue + watermark pull, derived columns excluded from mobile writes, API recomputes totals after food pushes. |

### Major (corrected in the plan)

| # | Finding | Resolution |
|---|---|---|
| R5 | WorkoutSchedule `@@unique([date])` — a second user's `generateSchedule` mutates the first user's rows; the execution chain (Session → ExerciseLog) is unscoped. | §2.5: Phase 0 decision gate — recommended: add userId to the calendar chain now. |
| R6 | Docker snippet used `web`/`mysql` service names; repo actually uses `app`/`db`. Missing env_file, healthcheck dependency, TZ, and prisma generate in the api build. | §5 rewritten to match the real compose file. |
| R7 | No `/devices` endpoint despite DeviceToken model + register.ts — mobile cannot register its push token. | Added POST/DELETE `/devices` to §3.2. |

### Minor (addressed)

- Reminder timezone: bare `"05:00"` fires at UTC in the container (14:00 KST bug) → store IANA timezone + `TZ: Asia/Seoul` (R6, §2.3/§5).
- Auth overkill for 1 user: review suggested JWT+refresh or long-lived token — **superseded by user decision: HTTP Basic Auth** (2026-08-10). Simpler offline sync (no token expiry), same bcryptjs hashing; requires TLS termination + failed-login rate limiting.
- `/auth/register` on a public box lets anyone create an account → seed user from env (`SEED_EMAIL`/`SEED_PASSWORD`) or rate-limit login (R-other).
- MealTemplate `@@unique([name])` stays global after adding userId → `@@unique([userId, name])` (R-other, §2.2).
- API base URL for the phone unaddressed → mobile config field (R-other, §5).
- Android 13+ `POST_NOTIFICATIONS` runtime permission part of register flow (§6).
- Read-only workout card verified feasible; add `weeklyProgress` to `/schedule/today` (§3.2) and mirror `generateScheduleIfMissing` on first hit.
- Prune dead device tokens on `DeviceNotRegistered` (§6).
- `ProgressPhoto` explicitly out of v1 scope (noted, not scoped).

### Verification notes

- Card data check: `getScheduleForDate` returns schedule + workout + exercises + exercise (name, sets, min/max reps, rest time, notes) — sufficient for the read-only card. `weeklyProgress` already computed in `queries/today.ts`.
- Expo push via `expo-server-sdk` + managed workflow is the standard approach; no special iOS background handling needed for simple reminders; deep links via `somatix://` with expo-router.
