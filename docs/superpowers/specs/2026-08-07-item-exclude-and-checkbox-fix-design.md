# Exclude/Remove Packing Items + iOS Checkbox Visibility Fix

## Context

Two issues in the packing plan output screen (`src/screens/OutputScreen.tsx`,
`src/components/PackingItemRow.tsx`):

1. There's no way to remove an item from consideration — a user can't say "I
   don't need this" and have it stop counting against the weight budget.
2. The "packed" checkbox is effectively invisible in its unchecked state on
   iOS.

## Root cause: checkbox visibility

Confirmed by reading `node_modules/react-native-paper/src/components/Checkbox/CheckboxIOS.tsx`:
`<Checkbox>` auto-selects `CheckboxIOS` on iOS, which renders its icon at
`opacity: indeterminate || checked ? 1 : 0` — i.e. **zero opacity, no visible
box at all**, when unchecked. This is intentional native-iOS-style behavior
in the library (no affordance until checked), not a color/contrast bug —
`uncheckedColor` isn't even part of `CheckboxIOS`'s prop type, so passing it
would have no effect. `CheckboxAndroid`, by contrast, always renders a
bordered `checkbox-blank-outline` box regardless of checked state.

**Fix:** use `Checkbox.Android` explicitly (bypassing the platform
auto-switch) in `PackingItemRow`, with explicit `color`/`uncheckedColor`
theme colors, so both platforms get a consistently visible bordered box.

## Feature: exclude / remove items

### Data model

`PackingItem` (`src/types/packing.ts`) gains one new optional field:

```ts
excluded?: boolean;
```

Defaults to falsy/undefined for all items at generation time (no change to
`packingEngine.ts`'s item construction beyond the type gaining the field).

### Weight recalculation

`packingEngine.ts` currently computes `totalEstimatedWeightKg` once at
generation time via an inline reduce over all items. This sum needs to be
recomputed whenever items are excluded or removed, and must ignore excluded
items. Extract the existing inline calculation into a small exported pure
function in `packingEngine.ts`:

```ts
export function sumWeightKg(items: PackingItem[]): number {
  return roundWeight(items.reduce((sum, item) => sum + item.estimatedWeightGrams * item.quantity, 0)) / 1000;
}
```

`generatePackingPlan` calls this with the full item list (unchanged
behavior — no items are excluded at generation time). The store's new
actions call it with `items.filter((i) => !i.excluded)`.

### Store actions (`src/state/useTripStore.ts`)

- `toggleItemExcluded(itemId: string)` — flips `excluded` on the matching
  item in `currentPlan.items`, then recomputes
  `totalEstimatedWeightKg`/`isOverWeight` on `currentPlan` via `sumWeightKg`
  over non-excluded items (`isOverWeight = totalEstimatedWeightKg >
  currentPlan.maxAllowedWeightKg`).
- `removeItem(itemId: string)` — splices the item out of
  `currentPlan.items` entirely, then recomputes the same two fields the
  same way. No confirmation dialog (matches "remove entirely" as stated) —
  this only affects the in-session draft plan, not a saved trip.

Both actions mirror the existing `toggleItemPacked` action's shape (operate
on `currentPlan`, no-op if `currentPlan` is null).

### `PackingItemRow.tsx`

- Add two trailing `IconButton`s to the right of the row: an eye/eye-off
  toggle (`eye-off-outline` when included → tapping excludes; `eye-outline`
  when excluded → tapping restores) calling `onToggleExcluded(item.id)`, and
  a trash icon (`trash-can-outline`) calling `onRemove(item.id)`.
- When `item.excluded` is true, wrap the row content in reduced opacity
  (e.g. `opacity: 0.5` on the row `View`) — distinct from the packed
  strikethrough-on-name treatment, and the row stays in place and stays
  interactive (checkbox and buttons still work).
- Component gains two new required props: `onToggleExcluded: (itemId:
  string) => void` and `onRemove: (itemId: string) => void`.

### `OutputScreen.tsx`

- `totalItemCount`/`packedItemCount` (already derived live via `.reduce`
  over `currentPlan.items`) both add a `!item.excluded` filter.
- `WeightBudgetBar` continues to read `totalEstimatedWeightKg`/`isOverWeight`
  directly off `currentPlan` — since the store actions above keep those
  fields in sync, no separate live-derivation is needed in the screen
  itself.
- Wire `toggleItemExcluded`/`removeItem` from the store into the two new
  `PackingItemRow` props.

## Testing

- `__tests__/packingEngine.test.ts` (or a new focused test file) covers
  `sumWeightKg` directly: empty array → 0, single item, excluded items
  excluded via the caller's pre-filter (the function itself doesn't know
  about `excluded` — it just sums whatever list it's given).
- New store tests for `toggleItemExcluded` and `removeItem`: toggling
  excludes/restores and recomputes weight; removing shrinks the items array
  and recomputes weight; both no-op safely when `currentPlan` is null.
- `PackingItemRow`/`OutputScreen` UI changes verified manually (matches
  existing convention — no component tests elsewhere in this codebase for
  leaf UI pieces).

## Non-goals

- No confirmation dialog before permanent delete.
- No "undo remove" — only exclude is reversible.
- No persistence of excluded/removed state across `computePlan()` regeneration
  or into `savedTrips` beyond whatever `saveTrip` already snapshots (removed
  items are simply gone from the array it saves; excluded items save with
  `excluded: true` since they're plain fields on the saved `PackingItem`).
