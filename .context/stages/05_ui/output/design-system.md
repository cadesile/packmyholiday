# Design system — "Lagoon & Sun"

Documented after the UI overhaul (branch `feat/lagoon-sun-ui`). Token sources are `src/theme/{paperTheme,fonts,radii,spacing,touchTargets}.ts`; the theme is fed to react-native-paper's `PaperProvider` in `App.tsx`. This replaces the earlier "Superr style guide" palette (Marker Orange / Fraunces / Geist); the code is the truth. Always take colors from `useTheme()` roles or the exported maps; don't invent new ones.

**Idea:** a calm teal base (Lagoon) keeps lists and numbers readable; one warm amber (Sun) is reserved for the single forward action on each screen. Cards sit on borders, not shadows.

## Color roles (`paperTheme.ts`; unlisted MD3 roles keep Paper defaults)
| Role | Light | Dark |
|---|---|---|
| `primary` (Lagoon 600) / `onPrimary` | `#0B6B73` / `#FFFFFF` | `#5CCBD1` / `#0A1A20` |
| `primaryContainer` / `onPrimaryContainer` | `#E6F3F3` (Lagoon 50) / `#0B5A62` (Lagoon 700) | `#16444A` / `#CFE9EA` |
| `secondary` (**Sun 400**) / `onSecondary` | `#FFB627` / `#0E2A33` | `#FFC857` / `#0A1A20` |
| `secondaryContainer` / `onSecondaryContainer` | `#FFEBC0` (Sun 100) / `#0E2A33` | `#4A3A12` / `#FFEBC0` |
| `tertiary` / `onTertiary` | `#2F5D8C` / `#FFFFFF` | `#8FB5DE` / `#0A1A20` |
| `tertiaryContainer` / `onTertiaryContainer` | `#DCE8F4` / `#16314E` | `#1F3F5F` / `#DCE8F4` |
| `background` (Ground) / `onBackground` (Ink) | `#F2F6F6` / `#0E2A33` | `#0A1A20` / `#E8F2F3` |
| `surface` / `onSurface` | `#FFFFFF` / `#0E2A33` | `#12262E` / `#E8F2F3` |
| `surfaceVariant` / `onSurfaceVariant` (Ink 2) | `#E6EEEE` / `#51666E` | `#1B333C` / `#9DB4BA` |
| `outline` / `outlineVariant` (Line) | `#7F9298` / `#D9E3E4` | `#5E7A82` / `#24404A` |
| `error` (Alert) / `onError` | `#C2412D` / `#FFFFFF` | `#F08A78` / `#3B0A0A` |
| `errorContainer` / `onErrorContainer` | `#FBE3DE` / `#5A150B` | `#5A150B` / `#FBE3DE` |

- **Sun lives in `secondary`.** Paper has no "cta" slot, so `secondary`/`onSecondary` carry the amber. `AppButton variant="primary"` is its only consumer (info banners use `secondaryContainer`). Everything else chromatic is teal.
- `outline` (unselected control borders) is 3:1 against white; `outlineVariant` is the hairline for cards and dividers.
- All Paper `elevation.level0–5` are overridden to flat `surface` (or transparent at 0), so Paper components never tint.
- `roundness: 14` on both themes.
- Dark theme is an interpretation of the light palette. `app.json` still has `userInterfaceStyle: "light"` (see open questions).

### Non-palette color maps (`paperTheme.ts`)
- `BRAND` — `lagoon #0B6B73`, `sun #FFB627`, `ink #0E2A33`, `white #FFFFFF`, `groundDark #0A1A20`. Logo and illustration colors; they don't change with the color scheme except where `LogoMark variant` says so.
- `CATEGORY_COLORS` (packing categories, all 4.5:1 under a white glyph) — clothing `#0B6B73`, toiletries `#A23B72`, footwear `#8A6A00`, electronics `#2F5D8C`, essentials `#6B4FA3`.
- `CLIMATE_CARD_COLORS` (all 4.5:1 under white text) — warm `#B4510A`, mild `#0B6B73`, cold `#2F5D8C`, rainy `#4A6174`; `CLIMATE_CARD_ICONS` — `weather-sunny`, `weather-partly-cloudy`, `snowflake`, `weather-rainy`.
- `STICKER_COLORS` was removed with the sticker accents.

## Typography (`fonts.ts`)
- **Bricolage Grotesque** (600, 700) for `display*`, `headline*`, `title*`; **Inter** (400–700) for `body*` and `label*`. `App.tsx` loads Inter 400/500/600/700 and Bricolage 600/700 from `@expo-google-fonts`.
- Custom fonts don't fake-bold, so every variant uses `fontWeight: '400'` and the weight is picked by font file. Exports: `INTER_FAMILY` {regular, medium, semibold, bold} and `BRICOLAGE_FAMILY` {semibold `BricolageGrotesque_600SemiBold`, bold `BricolageGrotesque_700Bold`}.
- The type scale is customised via `configureFonts` (size / line height):

| Variant | Font | Size / LH |
|---|---|---|
| `displayLarge` / `displayMedium` / `displaySmall` | Bricolage bold | 40/44, 36/40, **32/36** (screen titles) |
| `headlineLarge` / `Medium` / `Small` | Bricolage bold | 30/34, 26/30, 24/28 |
| `titleLarge` / `titleMedium` | Bricolage semibold | 20/26, 18/22 |
| `titleSmall` | Bricolage bold | 17/22 |
| `bodyLarge` / `bodyMedium` | Inter regular | 16/24 |
| `bodySmall` | Inter regular | 14/20 |
| `labelLarge` (buttons) | Inter semibold | 16/20 |
| `labelMedium` (section labels, step label) | Inter semibold, letter-spacing 0.78, usually uppercase | 13/16 |
| `labelSmall` | Inter medium | 12/16 |

- Pattern in code: emphasised body text sets `fontFamily: INTER_FAMILY.medium|semibold`; never hard-code a font name string.

## Scales
- `RADII` (`radii.ts`): inputs 14, segment 12, buttons 16, cards 20, hero 24, track 16, pill 999.
- `SPACING` (`spacing.ts`, 4 px base): xxs 4, xs 8, sm 12, md 16, lg 20, xl 24, xxl 28, xxxl 32, huge 40, giant 48, massive 64. `SCREEN_GUTTER` = 20 (horizontal padding for every screen and the action bar).
- `CONTROL_HEIGHT` = 52 (buttons, text fields; row `ChoiceTile` is 56).
- `MIN_TOUCH` = 44 and `HIT_SLOP_MIN` = 8 on every side (`touchTargets.ts`): any tappable control reaches 44 pt, either by size or by hit slop.
- Borders: 1 px hairlines for cards; 1.5 px for idle controls; 2 px for selected tiles (padding is reduced by the extra width so the tile doesn't jump).
- Shadow: only bottom action bars cast one (iOS shadow `#0E2A33` at 0.06 opacity, radius 10, offset -6; Android `elevation: 8`).

## Logo and app icons
- Mark: the **sunrise case** — a suitcase with a half-sun and horizon, drawn from code on a 64-unit grid (`Logo.tsx`: `LogoMark`, `Wordmark`, `Logo`). `LogoMark` takes `size`, `variant` (`'color' | 'reversed'`) and `background`. Rays drop out below 28 px and the horizon below 20 px.
- Wordmark: "pack" in `onSurface`, "myholiday" in `primary` (amber-tinted `#FFD27A` on dark backgrounds).
- Assets are generated by `node scripts/generate-assets.js` (sharp, no bitmap inputs); SVG sources are in `assets/brand/`.

| File | Use |
|---|---|
| `assets/icon.png` | iOS / general, 1024, opaque: white case on Lagoon |
| `assets/icon-dark.png` | iOS 18 dark appearance: lifted teal case on `#0A1A20` |
| `assets/icon-tinted.png` | iOS 18 tinted appearance: greyscale luminance only |
| `assets/android-icon-foreground.png` | Adaptive foreground, transparent, inside the 66 % safe zone |
| `assets/android-icon-monochrome.png` | Android 13+ themed icon (alpha silhouette) |
| `assets/notification-icon.png` | Status bar, white silhouette on transparent |
| `assets/splash-icon.png` | Splash logo, transparent; colour from `app.json` |
| `assets/favicon.png` | Web, 48 |
| `assets/store/play-store-icon-512.png` | Google Play listing |

`app.json`: `ios.icon` {light, dark, tinted}; `android.adaptiveIcon.backgroundColor` `#0B6B73` (flat colour, so no background bitmap); `expo-splash-screen` plugin with `splash-icon.png`, width 200, `contain`, background `#F2F6F6`.

## Shared components
| Component | Rules as implemented |
|---|---|
| `AppButton` | Replaces `PillButton`. Height `CONTROL_HEIGHT`, radius `RADII.buttons`, 1.5 px border, label `labelLarge`. Variants: `primary` (Sun fill, Ink text; disabled = `surfaceVariant`), `secondary` (surface fill, Lagoon border and text), `text` (44 high, no chrome). Optional `iconLeft` / `iconRight` (MaterialCommunityIcons names, 20 px); pressed = 0.85 opacity. One `primary` per screen |
| `AppHeader` | Navigator header: `Logo` plus a 44 px round saved-trips (bookmark) button with a `savedActive` state. Replaces the two-tone title in `RootNavigator` |
| `WizardStepLayout` | `StepProgressBar`, scrolling content (gutter 20, gap 24) starting with the screen title (`displaySmall`, `accessibilityRole="header"`), then a bottom bar (surface, top hairline, shadow) with Back (`secondary`) and Next (`primary`, trailing arrow). Props: `title`, `stepName`, `stepNumber`, `totalSteps`, `onBack`, `onNext`, `nextDisabled`, `nextLabel`. A non-default `nextLabel` (final step) removes the arrow and narrows Back to 96 px |
| `StepProgressBar` | Replaces `StepProgressDots`. "STEP n OF N" and the step name in `labelMedium` caps, over one 6 px segment per step: `primary` up to the current step, `outlineVariant` after. `accessibilityRole="progressbar"` |
| `SectionLabel` | Uppercase `labelMedium` caption above each field group |
| `SegmentedControl<T>` | Generic. Track `RADII.track` on `surfaceVariant`, selected segment `RADII.segment` filled `primary`; 44 high (48 for the standalone toiletry control) |
| `ChoiceTile` | Climate and activity tiles. `layout="row"` is 56 high with a trailing check; `"stacked"` is 96+ high with a check badge top-right (radius `cards`). Selected = `primaryContainer` fill + 2 px `primary` border + tick, so state never relies on color alone. Role `checkbox` |
| `RadioCard` | Airline picker option: `buttons` radius, 22 px radio with a 10 px dot, title and caption |
| `Stepper` | Round 44 px minus / plus buttons around a value (travelers, bags). Takes `accessibilityNoun` for labels |
| `InfoBanner` | `secondaryContainer` (Sun 100) banner, `buttons` radius, for guidance copy |
| `SelectableChip` | Pill (`RADII.pill`, 44 high). Selected = `primaryContainer` fill + `primary` border + tick. Optional `badgeColor` renders the icon as a 28 px colored circle with a white glyph |
| `TripSummaryCard` | Hero card (`RADII.hero`) filled with `CLIMATE_CARD_COLORS[climate]`, white text (`#FFFFFF`), Bricolage for destination and stat numbers, three stat columns with hairline dividers |
| `PackingItemRow` | Custom 24 px checkbox in a 44 px target; name struck through and `onSurfaceVariant` when packed; excluded rows at reduced opacity; compact quantity stepper kept inline (not the 44 px `Stepper`); eye and trash `IconButton`s with `HIT_SLOP_MIN` and `accessibilityLabel`s |
| `WeightBudgetBar` | `titleLarge` weight text, 10 px track (radius 5) on `surfaceVariant`; fill `primary`, or `error` when over budget, plus an over-budget message |
| `TravelerCard`, `ActivityChipGrid`, `AirlinePicker`, `LocationSearchInput`, `TripDateRangePicker` | Restyled onto the same tokens (surface + hairline border, `inputs` radius for fields, `ChoiceTile` / `RadioCard` / `SegmentedControl` inside) |
| `ErrorBoundary` | Reset action uses `AppButton` |
| `SavedTripsScreen` cards | Surface + 1 px `outlineVariant` border, `cards` radius; 52 px rounded climate badge (`CLIMATE_CARD_COLORS` + white icon); delete `IconButton` with `HIT_SLOP_MIN` |

Removed with the overhaul: `PillButton`, `StepProgressDots`, `StickerAccent`, `MarkerHighlight` (was unused).

## Patterns the code applies consistently
- Colors come from `useTheme()` roles or the exported maps. The only literals outside `src/theme/` are `#FFFFFF` over climate/category colors (`SelectableChip`, `TripSummaryCard`, `SavedTripsScreen`), `#FFD27A` in the dark wordmark, and the `#0E2A33` shadow color on action bars.
- One Sun (`primary`) button per screen, always the forward action; Back and secondary actions are Lagoon outline or text.
- Selection is shown with a `primaryContainer` fill, `primary` border **and** a check, never color alone.
- Titles are sentence-case questions or statements ("Where are you off to?"), not lowercased.
- Every tappable control is at least 44 pt, by size or `HIT_SLOP_MIN`; icon buttons set an `accessibilityLabel`.
- Icons in the app are MaterialCommunityIcons through Paper's `Icon`.

## Where the code does *not* follow a single rule
- `PackingItemRow` keeps a compact quantity stepper rather than the shared 44 px `Stepper`, to keep rows dense.
- `OutputScreen` and `SavedTripsScreen` define their own bottom-bar styles instead of sharing the `WizardStepLayout` one.
- The design canvas draws custom lucide-style icons; the app uses MaterialCommunityIcons equivalents.
- The Design System board on the canvas may still show Display as 34/38; the code value is 32/36.

## Open questions
- `app.json` sets `userInterfaceStyle: "light"`, while `App.tsx` selects `darkTheme` when `useColorScheme()` is `dark`. The dark theme and the iOS dark/tinted icons exist, but which applies on each platform is undecided.
- `assets/logo_master.png` and `assets/notification_icon.svg` are no longer referenced and can be deleted.
