# UX Task List

## Done

1. ✅ Sidebar overflow — the two bottom buttons (Profile, Workout Log) used to push below the screen and make the sidebar scroll. Now the sidebar is pinned to the viewport (`h-dvh`), nav scrolls internally (`min-h-0 flex-1 overflow-y-auto`), and the footer stays on screen. *Committed in f1d49c6.*

2. ✅ Daily log prefill — all daily fields (weight, sleep, energy, mood, calories, protein, carbs, fat) now prefill from the previous day's values so users tweak instead of retyping. Today's own values always win. Notes, water, and steps are intentionally not prefilled. *Committed in f1d49c6.*

3. ✅ Number inputs — new reusable `NumberInput` component with −/+ steppers, arrow-key stepping, clamp-on-blur, and empty-field support. Wired into the quick check-in numeric fields and the workout session reps/weight/duration inputs. *Committed in f1d49c6.*

## Notes

- The reference component in the original task used `lucide-react`; the project has switched to `@phosphor-icons/react`, so the implemented component uses phosphor `Minus`/`Plus`.
- Also fixed a latent bug found during this work: `/history` was statically prerendered and queried the DB at build time (stale data + build failures when MySQL is briefly down). Now `force-dynamic`.
