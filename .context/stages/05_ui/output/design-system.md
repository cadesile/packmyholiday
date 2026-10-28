# Design system

Documented from the **working tree** (the theme files and several components have uncommitted edits at generation time — see `../../02_architecture/output/git-activity.md`). Token sources are `src/theme/{paperTheme,fonts,radii,spacing,touchTargets}.ts`; the theme is fed to react-native-paper's `PaperProvider` in `App.tsx`. Source comments say the palette, radii and spacing come from a "Superr style guide" that is not in this repo — the code is the truth. Always take colors from `useTheme()` roles or the exported maps; don't invent new ones.

## Color roles (`paperTheme.ts`; unlisted MD3 roles keep Paper defaults)
| Role | Light | Dark |
|---|---|---|
| `primary` (Marker Orange) | `#ff6f1e` | `#ff8c47` |
| `onPrimary` | `#fdfbf9` | `#2b1a07` |
| `primaryContainer` / `onPrimaryContainer` | `#ffe4d1` / `#2b1a07` | `#5c3212` / `#ffe4d1` |
| `secondary` (Burnt Sienna) / `onSecondary` | `#ce500a` / `#fdfbf9` | `#e2895a` / `#2b1a07` |
| `secondaryContainer` / `onSecondaryContainer` | `#f7efe9` / `#2b1a07` | `#3a2a20` / `#f7efe9` |
| `tertiary` (Sprout) / `onTertiary` | `#22c55e` / `#fdfbf9` | `#4ade80` / `#0f3d22` |
| `tertiaryContainer` / `onTertiaryContainer` | `#dcf6e6` / `#0f3d22` | `#155d34` / `#dcf6e6` |
| `background` / `onBackground` | `#fdfbf9` / `#171717` | `#171717` / `#fdfbf9` |
| `surface` / `onSurface` | `#fdfbf9` / `#171717` | `#221f1c` / `#fdfbf9` |
| `surfaceVariant` / `onSurfaceVariant` | `#f7efe9` / `#5c5754` | `#2b1a07` / `#bebcbb` |
| `outline` / `outlineVariant` | `#171717` / `#bebcbb` | `#bebcbb` / `#3a342f` |
| `error` / `onError` | `#DC2626` / `#FFFFFF` | `#F87171` / `#3B0A0A` |

Light theme: cream-paper canvas, marker-orange as the one chromatic UI color, charcoal for text and borders. `tertiary` is meant sparingly for tag/divider accents. The dark theme is, per its own comment, an interpretation (the guide is light-only).

### Non-palette color maps (`paperTheme.ts`)
- `STICKER_COLORS` — `sky #3b82f6`, `bubblegum #ff66cf`, `sprout #22c55e`. Decorative only; never for buttons, links, or category/status.
- `CATEGORY_COLORS` (packing categories) — clothing `#ce500a`, toiletries `#0e7490`, footwear `#a16207`, electronics `#374b43`, essentials `#7c3aed`.
- `CLIMATE_CARD_COLORS` — warm `#ff6f1e`, mild `#5c5754`, cold `#0e7490`, rainy `#374b43`; `CLIMATE_CARD_ICONS` — `weather-sunny`, `weather-partly-cloudy`, `snowflake`, `weather-rainy`.

## Typography (`fonts.ts`)
- **Fraunces** for the MD3 `display*`, `headline*` and `title*` variants; **Geist** for `body*` and `label*`. Sizes and line heights are Paper's default MD3 typescale (`configureFonts()` is not customized); only the font family is remapped per variant weight.
- Custom fonts don't fake-bold, so each weight maps to a real file. `GEIST_FAMILY`: regular `Geist_400Regular`, medium `Geist_500Medium`, semibold `Geist_600SemiBold`, bold `Geist_700Bold`. `FRAUNCES_FAMILY`: regular/medium/semibold are 400/500/600 and **bold also resolves to `Fraunces_600SemiBold`** (no 700 file is loaded; `App.tsx` loads Geist 400–700 and Fraunces 400–600).
- Pattern in code: headings/numbers that need weight use `FRAUNCES_FAMILY.bold`; emphasised body text uses `GEIST_FAMILY.medium|semibold|bold`.

## Scales
- `RADII` (`radii.ts`): tags 20, cards 12, footer 56, inputs 8, buttons 20.
- `SPACING` (`spacing.ts`, 4 px base): xxs 4, xs 8, sm 12, md 16, lg 20, xl 24, xxl 28, xxxl 32, huge 40, giant 48, massive 64.
- `HIT_SLOP_MIN` (`touchTargets.ts`): 8 px on every side, used to reach a ~44 pt touch target without changing an `IconButton`'s visual size.

## Shared components
| Component | Rules as implemented |
|---|---|
| `PillButton` | Paper `Button mode="outlined"`, fill `surface`, text `onSurface`, `borderRadius: RADII.buttons`, 1.5 px `outline` border. By design no solid CTA fill — the dark border carries the identity. Used for wizard Back/Next, Save Trip, error reset |
| `WizardStepLayout` (all 5 wizard steps) | Step dots on top; scroll content (padding 16, gap 16); title is `headlineSmall` **lowercased** with an optional `StickerAccent`; bottom bar filled with `primary`, top corners `RADII.footer`, holding Back/Next `PillButton`s (`nextLabel` default "Next", `nextDisabled` supported) |
| `StepProgressDots` | 26 px circles, 1.5 px border. Active and completed are filled `primary` (completed shows a check icon); upcoming are `surface` with an `outline` border. 2 px connectors are `primary` up to the current step, else `outlineVariant` |
| `SelectableChip` | Paper `Chip`. Selected: flat, `secondaryContainer` fill, 1.5 px `primary` border, `primary` selected color, Geist bold label. Unselected: outlined with `outline` border. Optional `badgeColor` renders the icon as a 22 px colored circle with a white (`#FFFFFF`) glyph. Exists because Paper doesn't show selection when a custom icon is set |
| `StickerAccent` | Decorative `Icon` tinted from `STICKER_COLORS` (default `sky`), size 28, rotated (default 8°). Never functional UI |
| `MarkerHighlight` | `primary`-colored, underlined inline text. **No file imports it** at generation time |
| `TripSummaryCard` | Background `CLIMATE_CARD_COLORS[climate]`, radius 16 (literal, not `RADII.cards`), all text hard-coded `#FFFFFF`, Fraunces bold for destination and stat numbers, a 72 px translucent climate icon (`rgba(255,255,255,0.22)`), three stat columns with hairline dividers (`rgba(255,255,255,0.25)`) |
| `PackingItemRow` | `Checkbox.Android` (`primary` / `outline`); name in Geist medium, struck through and `onSurfaceVariant` when packed; excluded rows at 0.5 opacity; quantity stepper (size-14 `IconButton`s, minus disabled at 1); eye and trash `IconButton`s (size 20); all with `accessibilityLabel` and `HIT_SLOP_MIN` |
| `WeightBudgetBar` | Fraunces-bold `titleLarge` weight text, Paper `ProgressBar` 8 px high / radius 4, `primary` normally and `error` when over budget, plus an over-budget message |
| `TravelerCard` | Paper `Card mode="outlined"`; `SegmentedButtons` for age group and clothing style; `Switch` for sensitive skin; field labels `labelLarge` in Geist semibold |
| App title (`RootNavigator`) | Two-tone Fraunces bold: "pack" in `onSurface`, "myholiday" in `primary` |
| `SavedTripsScreen` | Header band `secondary` with 20 px bottom corners; cards `mode="contained"`, radius 14, name in Fraunces semibold |

## Patterns the code applies consistently
- Colors come from `useTheme()` roles or the exported maps. The only literals outside `src/theme/` are `#FFFFFF` in `SelectableChip` and `TripSummaryCard`, plus the rgba whites in `TripSummaryCard`.
- Every `IconButton` in `PackingItemRow`, `TravelerCard`, `OutputScreen`, `SavedTripsScreen` and `Step5BaggageReview` passes `hitSlop={HIT_SLOP_MIN}`. The icon buttons in the first four also set an `accessibilityLabel`; the bag steppers in `Step5BaggageReview` do not.
- Borders use the `outline` role (charcoal in light); selection is shown with a `primary` border and `secondaryContainer` fill rather than a solid fill.

## Where the code does *not* follow a single rule
- `RADII` and `SPACING` are imported only by `WizardStepLayout` and `PillButton`; other components and screens use literal radii and spacing (e.g. 12, 14, 16, 20).
- `PillButton` is the pattern for primary actions, but `Step2Travelers` uses a plain Paper `Button mode="outlined"` for "Add Traveler" and `OutputScreen` / `SavedTripsScreen` use `Button mode="text"` for back actions.

## Open questions
- `app.json` sets `userInterfaceStyle: "light"`, while `App.tsx` selects `darkTheme` when `useColorScheme()` is `dark`. The code alone doesn't show which applies on each platform.
- The "Superr style guide" the theme cites isn't in the repo; if it matters, ask the owner for it.
