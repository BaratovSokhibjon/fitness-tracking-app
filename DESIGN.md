---
version: alpha
name: Somatix-quiet-data-ledger
description: |
  A quiet, flat, data-first system for a personal fitness dashboard. Warm paper-white surfaces (never cool gray), near-black Ink text, a single Success-green accent reserved exclusively for progress and goal completion, sharp 0-4px corners (no pills), hairline borders instead of shadows, and JetBrains Mono tabular numerals as the visual hero of every metric card. The chrome is deliberately silent so the numbers carry all the weight — serious, trustworthy, un-gamified.

colors:
  ink: "#111111"
  on-primary: "#ffffff"
  canvas: "#ffffff"
  linen: "#f9f8f5"
  cloud: "#f2f1ec"
  charcoal: "#2b2a27"
  ash: "#4c4b47"
  mute: "#706f69"
  stone: "#9e9d96"
  hairline: "#e3e3dd"
  hairline-soft: "#ecebe6"
  success: "#1e9e52"
  success-bright: "#2fc46b"
  sale: "#d30005"
  sale-deep: "#780700"
  info: "#1151ff"
  info-deep: "#0034e3"

typography:
  font-sans:
    fontFamily: Inter
    weights: 400 / 500 only
    sentence-case: true
  font-mono:
    fontFamily: JetBrains Mono
    weights: 400 / 500 / 600
    tabular-nums: true
  display-xs:
    fontSize: 40px
    fontWeight: 600
    letterSpacing: -0.02em
  heading-xl:
    fontSize: 24px
    fontWeight: 600
    letterSpacing: -0.01em
  heading-lg:
    fontSize: 20px
    fontWeight: 600
    letterSpacing: -0.01em
  heading-md:
    fontSize: 15px
    fontWeight: 500
  body-md:
    fontSize: 14px
    fontWeight: 400
  label-sm:
    fontSize: 12.5px
    fontWeight: 500
  caption-mono:
    fontSize: 11px
    letterSpacing: 0.08em
    textTransform: uppercase
  data-md:
    fontSize: 26px
    fontWeight: 600
    fontVariantNumeric: tabular-nums
  data-sm:
    fontSize: 13px
    fontWeight: 400

rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 9px 20px
    hover-background: "{colors.charcoal}"
  button-secondary:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 9px 20px
    border: 1px "{colors.hairline}"
    hover-background: "{colors.cloud}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.mute}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    hover-text-color: "{colors.ink}"
  chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.md}"
    padding: 5px 12px
    border: 1px "{colors.hairline}"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: 5px 12px
    border: 1px "{colors.ink}"
  chip-filled:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 5px 12px
    border: none
  badge-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: 3px 8px
  badge-mute:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.mute}"
    rounded: "{rounded.none}"
    padding: 3px 8px
  badge-success:
    backgroundColor: "mix(success, 12%, transparent)"
    textColor: "{colors.success}"
    rounded: "{rounded.none}"
    padding: 3px 8px
  badge-sale:
    backgroundColor: "mix(sale, 10%, transparent)"
    textColor: "{colors.sale}"
    rounded: "{rounded.none}"
    padding: 3px 8px
  metric-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    border: 1px "{colors.hairline}"
    padding: 16px
  progress-bar:
    backgroundColor: "{colors.linen}"
    fill-color: "{colors.success}"
    radius: 3px
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: 1px "{colors.hairline}"
    padding: 10px 14px
    focus-border: "{colors.ink}"
  alert-success:
    border-color: "mix(success, 40%, hairline)"
    textColor: "{colors.ink}"
  alert-warning:
    border-color: "mix(mute, 60%, hairline)"
    textColor: "{colors.ink}"
  alert-error:
    border-color: "mix(sale, 40%, hairline)"
    textColor: "{colors.ink}"
  nav-item:
    textColor: "{colors.mute}"
    rounded: "{rounded.md}"
    padding: 9px 10px
    active-background: "{colors.canvas}"
    active-border: 1px "{colors.hairline}"
    active-dot: "{colors.success}"
  dashboard-layout:
    sidebar-width: 208px
    sidebar-background: "{colors.linen}"
    main-padding: 24px
  workout-row:
    paddingTop: 12px
    border-top: 1px "{colors.hairline}"
  ring-progress:
    color: "{colors.success}"
    track: "{colors.linen}"
---

## Overview

Somatix is a personal fitness dashboard — workouts, nutrition, body measurements, and daily habits logged by a single athlete. There is no audience, no gamification, no feed; the surface is a private instrument. The design takes the form of a **quiet data ledger**: warm paper, near-black ink, one semantic accent, and numerals that dominate every card. The product's memorable quality is `serious, quiet, trustworthy`, and every token serves it — the chrome is silent so the numbers speak.

The spec is a direct evolution of the earlier Nike-inspired retail analysis: the neutral ink/canvas/soft-cloud scale survives, but every Nike-specific choice is reversed. Pills → sharp `{rounded.md}` (4px) corners. Cold gray → warm `Linen`/`Cloud`. Campaign typography → a two-family system (sans + mono). Photography-first chrome → border-and-space-first data chrome. There are no gradients, no drop shadows, no decorative icons, and no hover animation beyond state transitions at 100–150ms.

**Key Characteristics:**
- Warm paper surfaces: `{colors.canvas}` (white) sits on `{colors.linen}` (warm off-white) and `{colors.cloud}`; cool gray is forbidden.
- A single accent color — `{colors.success}` — reserved exclusively for progress and goal completion. Sale red is error-only. No decorative color anywhere.
- Sharp corners: `{rounded.none}` on all cards and containers, `{rounded.md}` (4px) on buttons/chips/inputs, `0–12px` max. No pills above 8px.
- **The number is the hero.** Metric values render in `{typography.font-mono}` (JetBrains Mono 600 tabular), 26px. Units sit small and mute below. Labels are tiny uppercase mono.
- Zero elevation: layerst of insight via surface color (`Linen` under `Canvas`) and `{colors.hairline}` borders. No shadows anywhere in the system.
- Warm grays always: `#f9f8f5`, `#f2f1ec`, `#e3e3dd` — never blue-cool grays, which read as stock SaaS and burn the trust.

## Colors

### Brand & Surfaces
| Token | Value | Role |
|---|---|---|
| **Ink** (`{colors.ink}`) | `#111111` | Text, primary button, active chip — the only near-black in the system. |
| **Canvas** (`{colors.canvas}`) | `#ffffff` | Page background, card surfaces. Rarely used pure on pure; prefers warming via Linen. |
| **Linen** (`{colors.linen}`) | `#f9f8f5` | Secondary surface — sidebar, footer, filled chip, hover pools. The distinct warm register. |
| **Cloud** (`{colors.cloud}`) | `#f2f1ec` | Active/hover tint, filled chips, subtle banding. |
| **Hairline** (`{colors.hairline}`) | `#e3e3dd` | All 1px borders and dividers. |
| **Hairline Soft** (`{colors.hairline-soft}`) | `#ecebe6` | Inset bottom edge on sticky bars and tab strips. |

### Text
| Token | Hex | Role |
|---|---|---|
| **Charcoal** (`{colors.charcoal}`) | `#2b2a28` | Button hover; slightly soft ink. |
| **Muted** (`{colors.mute}`) | `#706f69` | Secondary text, units, metadata, nav inactive. |
| **Ash** (`{colors.ash}`) | `#4c4b47` | Pressed/disabled secondary text, medium emphasis. |
| **Stone** (`{colors.stone}`) | `#9e9d96` | Lowest-emphasis text on light; inverse-on-dark secondary. |

### Semantic
| Token | Hex | Role |
|---|---|---|
| **Success** (`{colors.success}`) | `#1e9e52` | The single accent. Progress bars, goal completion, streak, "goals met". **Never decorative.** |
| **Success Bright** (`{colors.success-bright}`) | `#2fc46b` | Dark-surface success. |
| **Sale** (`{colors.sale}`) | `#d30005` | Errors and destructive actions only. Never a badge background. |
| **Sale Deep** (`{colors.sale-deep}`) | `#780700` | Sale pressed state / dark-mode destructive. |
| **Info** (`{colors.info}`) | `#1151ff` | Inline links occasionally; rare. |
| **Info Deep** (`{colors.info-deep}`) | `#0034e3` | Pressed state for info links. |

### Color Rules (non-negotiable)
1. One accent per surface: Success green is reserved for progress/confirmation/goal. Never two accents on one card.
2. Sale is destructive context only.
3. Ice-blue/cool grays are banned. Every gray is warm.
4. Grays build hierarchy, not color. If you can't argue that a color signals meaning, it's decorative and banned.

## Typography

### Fonts
- **Sans — Inter** (`src/app/layout.tsx` `--font-sans`): Body, headings, buttons. Weights **400** and **500** only — 600/700 read heavy in a data-dense UI. Reservoir of zero letter-spacing at small sizes, tight (-0.01–-0.02em) at display.
- **Mono — JetBrains Mono** (`--font-mono`): All numbers, dates, keystroke/dataless values, captions, eyebrows, and unit labels. `font-variant-numeric: tabular-nums` so columns align.
- Sentence case everywhere — never Title Case, never ALL CAPS (except tiny mono eyebrows).

### Scale
| Token | Size | Weight | Use |
|---|---|---|---|
| display-xs | 40px | 600 | First-viewport headline, hero number. |
| heading-xl | 24px | 600 | Page title. |
| heading-lg | 20px | 600 | Card titles. |
| heading-md | 15px | 500 | List item titles, workout names. |
| body-md | 14px | 400 | Default body, secondary copy. |
| label-sm | 12.5px | 500 | Form labels, button-heavy text. |
| caption-mono | 11px | 500 mono | Eyebrow, section captions (uppercase, tracked 0.08em). |
| data-md | 26px | 600 mono | Metric card value (tabular). |
| data-sm | 13px | 400 mono | Unit suffixes, small data. |

### Hierarchy Rules
- The number is always larger and mono. The label is small, uppercase, muted. The unit is smallest and muted below the numeral.
- Never compete with the data: chrome type stays below 15px sans; numbers get the size budget.

## Spacing

- **Base unit:** 4px. All tokens are multiples of 2.
- | Token | Value | Use |
  | xxs | 2px | micro gaps |
  | xs | 4px | inner gaps in chips/icons |
  | sm | 8px | form row gaps, macro labels gap |
  | md | 12px | card row padding, chip padding |
  | lg | 16px | standard card inner padding |
  | xl | 24px | section/page gutter, dashboard main padding |
  | xxl | 32px | card block padding on detail views |
  | section | 48px | section rhythm between blocks |
- On mobile, `section` drops to 32px; `xl` to 20px. Card padding `lg` stays.

`Tailwind` token mapping: `xxs/xs/sm/md/lg/xl/xxl/section` are defined in `tailwind.config.ts` under `theme.extend.spacing`, values on the 4px grid.

## Layout

### Dashboard
- Sidebar `{component.dashboard.sidebar-width}` (320px) on `{colors.linen}` with nav items. Main content `{colors.canvas}` with `xl` (24px) padding.
- Metric row: 3-up at desktop (metric-card), collapsing 1-up under 960px. Each metric card shows label / value+unit / delta below.
- Content columns: card stacks with `xl` gap, hairlines removed between, sections separated by `section`/2 rhythm.

### Containers
- All containers `sharp` (`{rounded.none}`) unless really interactive (inputs, buttons, chips `{rounded.md}` 4px).
- Elevation table:
  - 0 — Flat: default, no border.
  - 1 — Hairline: 1px `hairline` around every bordered surface (metric cards, inputs).
  - 2 — Inset bottom-line: `inset-box-shadow 0 -1px 0 {hairline-soft}` for sticky strips.
  - **No drop shadows ever.**

## Charts & Data Visualization

- Headline the number: large mono value above the chart is the consumer pattern (Apple Health).
- Bar chart fills on `{colors.success}`; comparison/background bars on `{colors.linen}`. Today's bar = full success, past counts lighter.
- Goal line: thin, dashed, neutral; "goal" label mono 10px mutation.
- Sparse direct labels: Sunday/Saturday borders only, mono 10–11px, muted.
- Ring/arc progress: stroke `{colors.success}`, track `{colors.linen}`, metric mono 600 centered.

## Motion

- **Minimal-functional** — only transitions that aid comprehension.
- State: opacity/bg 100–150ms `cubic-bezier(0.2,0,0,1)` (hover, active, popover).
- Completion: numerals count (increment) on goal met (200–300ms).
- No entrance choreography, no bounce, no parallax.

## Dark Mode

- Same palette semantics, inverted surfaces:
  - background `#0d0d0b`, linen `#141412`, cloud `#1b1a17`.
  - Ink flips to `#f2f1ec` (light), texts lighten correspondingly.
  - Success brightens (`#2fc46a`), hairline darkens (`#2a2a27`).
- Primary button flips: `ink-bg` in light → light-bg + dark-text in dark (inversion, not a tint).

## Do's and Don'ts

### Do
- Reserve Success green exclusively for progress, goals, streak, "on track". Reusing for decoration dilutes the signal.
- Keep the number in mono 600 tabular at data-md or larger. Let it dominate the card.
- Use hairline borders + Linen layering over shadows. Elevation is surface color, never shadow.
- Sharpen everything: containers 0, controls 4px. No pill buttons above 8px.
- Use warm grays (#f9f8f5 family). Never blue-cool.

### Don't
- No new accent colors. The semantic set is closed: Success, Sale, Info (link only), toggled.
- No gradients, no drop shadows, no duotones, no stock photography.
- No decorative icons or badges — if it isn't a button, chip, input, or data cell, don't render it.
- Don't use 600/700 weights in Inter UI text.
- Don't Title Case.
- Don't mix two accent colors on the same card.

## Component Notes

- `button-ghost` has no filled state—text is mute, hover ink.
- Inputs have gray hairline borders; focus lifts the border to `{colors.ink}` with a soft `{colors.cloud}` ring. No glow.
- Alerts are bordered flat panels: silhouette color at low opacity mix on the left icon, ink text, and the pairing color maps (success-green, warning-mute, error-sale).
- Weekend bars / creatine ring reuse progress-bar token.

## Responsive Behavior

- Below 960px: 3-up metric row → 1-up; dashboard goes single-column (sidebar collapses to a top row or drawer).
- Macro grid 4→2→1; workout row keeps leading icon; ring shrinks but stays ≥44px tap-style.
- Type descends: display-xs 40→32, heading-xl 24→20.

## Iteration Guide

1. Edit the front matter tokens, not prose. Rates resolve (`{colors.ink}` etc.).
2. Add new button states as separate `components:` entries (`-active`, `-disabled`), never a hover stand-in.
3. Validate contrast: text-mono on linen, success-on-linen (banner) must stay ≥4.5:1.
4. Prefer composing existing primitives (`src/components/ui/*`) over new ones — the system runs on the tokens.
5. When introducing a new component, ask: can it be expressed with the existing card + hairline + mono-numeral + one-verb per-surface vocabulary? If yes — don't add tokens.

## Known Gaps

- **Dark mode**: token values defined above; not yet implemented or screenshot-verified in the app.
- **Mobile nav**: drawer spec not written; follow Linen sidebar collapsing conventions.
- **Toast/notification styling**: not yet part of the system; alert-card maps as interim.