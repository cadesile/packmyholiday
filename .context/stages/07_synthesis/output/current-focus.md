# Current focus

Snapshot at 2026-10-28. The commit log alone understates what is happening: the last commit is 2026-08-11, but the working tree has changed since then (details in `../../02_architecture/output/git-activity.md`).

## What looks active
- **Visual identity / restyle (uncommitted).** New `PillButton`, `StickerAccent` and `MarkerHighlight` components, new `radii.ts` / `spacing.ts`, edits to `fonts.ts` and `paperTheme.ts`, and restyled screens, all in the "Superr" cream-and-marker-orange direction. See `../../05_ui/output/design-system.md`. `MarkerHighlight` isn't used anywhere yet, and `RADII` / `SPACING` are only partly adopted, which suggests the restyle is mid-way.
- **Release pipeline.** `eas.json`, `scripts/build-ios.sh`, `scripts/build-android.sh`, `scripts/generate-assets.js` and new icon/splash assets are staged but uncommitted. File modification times at the repo root: `eas.json` 2026-10-26, `app.json` 2026-10-06, `App.tsx` / `package.json` 2026-09-25. See `../../01_overview/output/` and `../../../shared/stack.md` for the build setup.
- **Backend and website (design only).** The last commits (2026-08-11) are the spec and plan for a separate `packmyholiday-backend` repo; no code for it exists here. See `../../06_documentation/output/index.md`.

## Where feature work last landed
Packing-engine and store changes dominated the history (`packingEngine.ts`, `useTripStore.ts`, `types/packing.ts` and their tests). The final feature commits (2026-08-07) were item exclude/remove, the quantity stepper and clothing-reuse toggle, and locking the trip name until something changes.

## Heads-up for the next agent
The staleness check keys on commits, and HEAD still equals the commit this context was first synced to, so it will report nothing even though UI, assets and build config have moved. Treat `05_ui` and the build details as the likeliest to drift until that work is committed.
