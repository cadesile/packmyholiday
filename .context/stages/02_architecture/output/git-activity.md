# Git activity

Snapshot taken 2026-10-28 from `git log` at HEAD `53a62e9` (31 commits, 2026-08-06 → 2026-08-11 — the whole history spans six days).

## Where change happens (commits touching each area)
`__tests__` 16 · `src/utils` 11 · `docs` 8 · `src/screens` 7 · `src/data` 7 · `src/components` 7 · `src/state` 6 · `src/types` 5 · repo root 5 · `src/services` 4 · `src/theme` 2 · `src/navigation` 1 · `assets` 1.

## Hotspots (most-changed files)
`__tests__/packingEngine.test.ts` (8), `src/utils/packingEngine.ts` (7), `src/types/packing.ts` (5), `src/state/useTripStore.ts` (5), `__tests__/useTripStore.test.ts` (5), `src/screens/OutputScreen.tsx` (4).

## What changes together
Of the 5 commits touching `useTripStore.ts`, all 5 also touched `__tests__/useTripStore.test.ts`, 3 touched `src/types/packing.ts`, 3 touched `OutputScreen.tsx` and 3 touched `__tests__/packingEngine.test.ts`. In practice: a change to the trip model usually spans `types/packing.ts` + store + engine + their tests + the output screen.

## Timeline
- 08-06: baby/toddler packing items (toddler age group, infant/toddler/family gear); location search and weather lookup (Open-Meteo adapters, `TravelPlannerService`, trip dates, date-range picker, weather-driven climate in Step 1).
- 08-07: re-fetch weather on date change; sunscreen only for warm-climate trips; exclude/remove packing items and iOS checkbox fix; climate-coloured trip summary card; manual quantity stepper and clothing-reuse toggle; lock trip name and gate Save on real changes; "first build".
- 08-10: "latest build".
- 08-11: design spec and plan for a website and backend (docs only).

## Uncommitted work at generation time
`git status` showed 43 staged-but-uncommitted entries outside `.agents/` and `.context/`, which this context describes as they exist on disk: a UI restyle (new `MarkerHighlight`, `PillButton`, `StickerAccent` components; changes to `src/theme/{fonts,paperTheme}.ts` and new `radii.ts` / `spacing.ts`; edits across the wizard screens, `OutputScreen`, `SavedTripsScreen`, `RootNavigator`, and several components), icon/splash asset changes, `eas.json`, `scripts/*`, `.envrc`, `.claude/launch.json`, `package.json`/lock, `app.json` and `.gitignore`. One index entry, `global-context-generator` (mode 160000), points at a path that does not exist on disk. The staleness check keys on commits, so it will not see this work until it is committed.
