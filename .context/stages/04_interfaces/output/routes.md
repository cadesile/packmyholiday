# Routes (in-app screen flow)

There are **no HTTP routes, endpoints or controllers** in this repo — it is a client-only app. The closest equivalent is the screen flow in `src/navigation/RootNavigator.tsx` (a hand-rolled switch, not react-navigation) and the store actions each screen calls (`../../03_data/output/state.md`). External calls are in `services.md`.

## Screens
| Screen | Shown when | What it does (store actions used) |
|---|---|---|
| Wizard → `Step1LogisticsAirline` | `screen === 'wizard'` and `wizardStep === 1` | Location search (`selectLocation`, triggers weather fetch), date range (`setTripDates`), climate chips (`updateDraftConfig`), airline (`selectAirline`). Shows a hint that weather is a forecast or last year's estimate, or the lookup error with "pick a climate below" |
| Wizard → `Step2Travelers` | step 2 | Add/edit/remove travelers (`addTraveler`, `updateTraveler`, `removeTraveler`). Next is disabled, and `nextStep` is a no-op, with no travelers |
| Wizard → `Step3ActivityMatrix` | step 3 | Toggle activities (`updateDraftConfig({activities})`) |
| Wizard → `Step4HealthHygiene` | step 4 | Toiletry strategy, "Laundry Available Midway", "Reuse Some Clothing" (`updateDraftConfig`); a static health advisory list. The bug-spray hint is recomputed in the screen with the same rule as `utils/healthEngine.ts` (warm or rainy climate, or hiking) |
| Wizard → `Step5BaggageReview` | step 5 | Checked/cabin bag steppers (min 0, `updateDraftConfig`); shows the airline preset's default weights as information; "Generate Packing Plan" calls `computePlan` |
| `OutputScreen` | `screen === 'output'` — set automatically once the store has a `currentPlan`, or after opening a saved trip | Category tabs (clothing, toiletries, footwear, electronics, essentials); items grouped per traveler plus a "Shared" section; pack / exclude / remove / quantity (`toggleItemPacked`, `toggleItemExcluded`, `removeItem`, `setItemQuantity`); weight bar; suggestions dialog; Save Trip; "Back to Wizard" (`resetWizard`) |
| `SavedTripsScreen` | bookmark action in the app bar | Lists saved trips; tapping one runs `loadTrip` then goes to `output`; delete icon runs `deleteTrip`; Back returns to `output` if a plan exists, otherwise `wizard` |

## Save rules (`OutputScreen`)
- New trip: the name field is editable and Save is disabled while it is blank.
- Opened saved trip (`loadedTripId` set): the name is locked, and Save is enabled only if `utils/tripDiff.hasTripChanged` finds the config or plan changed (compared as JSON strings); saving updates that trip in place.

## Not present
No deep links, URL routing, auth, or server endpoints. Web builds (`expo start --web`) use the same screen switch.
