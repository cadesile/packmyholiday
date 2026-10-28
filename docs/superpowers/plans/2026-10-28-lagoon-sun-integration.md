# Lagoon & Sun UI Overhaul — Integration Plan

Source bundle: `/Users/courtneyadesile/Downloads/packmyholiday-lagoon-sun-changed-files` (changed files only, repo-relative paths).
Target: this repo, `main` @ `cdf3560`, clean tree. Do the work on a branch (`feat/lagoon-sun-ui`).

## Review findings

- **Scope is UI/brand only.** 61 files: 49 modified, 12+ new, 0 deleted. No changes to `src/state`, `src/services`, `src/data`, `src/types`, `src/utils`, `__tests__`, `eas.json` → data model and interfaces untouched (no `03_data` / `04_interfaces` updates needed).
- **Design change:** Marker Orange / Fraunces / Geist ("Superr") → Lagoon teal + Sun amber / Bricolage Grotesque / Inter.
- **New components (10):** `AppButton`, `AppHeader`, `ChoiceTile`, `InfoBanner`, `Logo`, `RadioCard`, `SectionLabel`, `SegmentedControl`, `StepProgressBar`, `Stepper`.
- **Replaced components (4), absent from bundle, to delete:** `MarkerHighlight`, `PillButton` (→ `AppButton`), `StepProgressDots` (→ `StepProgressBar`), `StickerAccent`. Bundle only mentions them in comments; nothing else imports them (verify by grep after copy).
- **Theme:** `paperTheme.ts`, `fonts.ts`, `radii.ts`, `spacing.ts`, `touchTargets.ts` all rewritten.
- **Deps (`package.json`):** remove `@expo-google-fonts/fraunces`, `/geist`; add `@expo-google-fonts/bricolage-grotesque ^0.4.1`, `/inter ^0.4.2`, `react-native-svg ^15.12.1` (**used by `Logo.tsx`; not currently installed**). `package-lock.json` differs (~160 lines).
- **`app.json`:** iOS 18 light/dark/tinted icons, adaptive-icon bg `#0B6B73`, `expo-splash-screen` plugin config (bg `#F2F6F6`). New icon files are in the bundle.
- **Assets:** `scripts/generate-assets.js` now draws the "sunrise case" mark from code (no `logo_master.png` input); regenerates PNGs + new `assets/brand/*.svg`, `assets/store/play-store-icon-512.png`, `icon-dark/tinted.png`. Bundle contains the generated outputs, so re-running isn't required.
- **`.context`:** bundle includes only `05_ui/output/design-system.md`. It matches the working-tree state, and the repo's committed `.context` already says the overhaul exists but "is not yet pushed" — so other stage outputs are stale (see Task 5).
- **Risks:** (a) binary asset overwrite (git is the rollback); (b) `app.json` icon/splash changes need a native rebuild/prebuild, not just Metro reload; (c) lockfile should be validated by `npm ci`; (d) dark mode: `app.json` still `userInterfaceStyle: "light"` — design doc lists this as an open question, not part of this integration.

## Tasks

### 1. Branch + baseline
```bash
git switch -c feat/lagoon-sun-ui
npx jest && npx tsc --noEmit   # record baseline results
```

### 2. Copy bundle over the repo (preserves layout)
```bash
rsync -a --exclude='.DS_Store' /Users/courtneyadesile/Downloads/packmyholiday-lagoon-sun-changed-files/ ./
git rm src/components/{MarkerHighlight,PillButton,StepProgressDots,StickerAccent}.tsx
git status --short   # expect ~61 changed + 4 deleted, nothing unexpected
```
(`assets/logo_master.png` and `assets/notification_icon.svg` stay; the new generator no longer reads the former — decide separately whether to delete both as orphaned.)

### 3. Dependencies
```bash
rm -rf node_modules && npm ci            # validates the bundled lockfile
npx expo install --check                 # confirm react-native-svg version matches SDK 54
```
If `npm ci` fails or Expo flags a mismatch, restore `package-lock.json` from git and run `npm install` instead. Old font packages should disappear from `node_modules/@expo-google-fonts`.

### 4. Verify
- `npx tsc --noEmit` and `npx jest` (must equal baseline; tests don't touch UI, so failures = real breakage).
- `grep -rE "MarkerHighlight|PillButton|StepProgressDots|StickerAccent|Fraunces|Geist" src App.tsx` → only comments.
- Run the app (`npx expo start`, iOS sim): walk wizard steps 1–5 → Output → Saved Trips; check fonts load (no fallback), Logo renders (svg), amber appears only on the primary action, splash/icon after `npx expo prebuild --clean` or a dev build.
- Light/dark: toggle the scheme and eyeball contrast.

### 5. Update `.context` (as part of this task, not after)
| File | Change |
|---|---|
| `stages/05_ui/output/design-system.md` | Already supplied by the bundle (copied in step 2). Remove "working tree / not yet pushed" wording once merged. Check it lists the 10 new components. |
| `stages/02_architecture/output/structure.md` | Line 10: fonts are Bricolage + Inter (not Geist/Fraunces); update component list (+10 / −4); mention `react-native-svg`, `assets/brand/`, `assets/store/`. |
| `stages/02_architecture/output/git-activity.md` | Replace the "43 staged-but-uncommitted entries … restyle" paragraph with the new commit(s). |
| `stages/07_synthesis/output/{overview,architecture-notes,current-focus}.md` | Drop Marker Orange/Fraunces/Geist references; current focus → Lagoon & Sun integrated; release pipeline note unchanged. |
| `stages/06_documentation/output/index.md` | Add this plan. |
| `shared/stack.md` | Font packages + `react-native-svg` in dependencies. |
| `shared/last-sync.md`, `shared/token-savings.md` | Update commit hash/date/stages touched; re-measure per SKILL.md. |
| `03_data`, `04_interfaces` | **No change** (confirmed: no state/service/data files in bundle). |

### 6. Commit
Two commits for clean history: (1) `feat(ui): Lagoon & Sun design system, components and brand assets` (code + deps + assets), (2) `docs: update .context for Lagoon & Sun overhaul`. Then PR to `main`. Native icon/splash changes mean the next EAS build must be a fresh native build (not an OTA update).

## Open decisions
1. Delete orphaned `assets/logo_master.png` + `assets/notification_icon.svg`? (default: keep until after merge)
2. Enable dark mode (`userInterfaceStyle`) — out of scope here; track separately.
