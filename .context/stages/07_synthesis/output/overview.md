# Overview

**packmyholiday** (store name "Take My Holiday") is a client-only mobile/web app that builds a packing list and weight budget for a trip. There is no server, database or account system in this repo. Stack facts: `../../../shared/stack.md`.

## What a user does
1. Walks a five-step wizard: destination, dates, climate and airline → travelers (adult/child/toddler/infant) → activities → health, laundry and toiletry choices → bag counts.
2. On the last step, the app generates a packing plan from deterministic rules. The plan is shown by category and traveler, against a weight budget derived from the bag counts.
3. The user can tick items as packed, exclude them from the budget, remove them, change quantities, and save the trip under a name. Saved trips live on the device only.

## How it hangs together
- Everything the user edits sits in one zustand store; plan generation is a pure function over that config. See `../../03_data/output/state.md` and `entities.md` for the rules.
- The one network dependency is Open-Meteo, used to look up a destination and derive the trip's climate from a forecast or last year's weather. See `../../04_interfaces/output/services.md`.
- Screen switching is hand-rolled in `RootNavigator`, with no navigation library. See `../../04_interfaces/output/routes.md`.
- Visual identity is a cream-paper / marker-orange React Native Paper theme with Fraunces and Geist fonts. See `../../05_ui/output/design-system.md`.

## Maturity
31 commits over six days (2026-08-06 → 2026-08-11), with test coverage on the engines, store and weather adapters but none on screens. Native builds go through EAS. A separate website and backend are designed but not built here. See `../../06_documentation/output/index.md`, and `current-focus.md` for what is moving now.
