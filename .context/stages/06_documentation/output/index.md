# Documentation index

Every markdown file in the repo outside `node_modules/`, `.expo/`, `.superpowers/`, `.claude/`, `.agents/` and `.context/`. There is **no `README.md`**. The root `CLAUDE.md` and `AGENTS.md` are gitignored agent pointer files, not project docs, so they aren't indexed. No docs were named canonical by the owner (no `tribal-knowledge.md` exists); all of these are dated design records, so check the code where it matters (see `../../03_data/` and `../../04_interfaces/`).

## Plans (`docs/superpowers/plans/`)
| File | Covers |
|---|---|
| `2026-08-06-baby-toddler-items.md` | Task-by-task plan (816 lines) to add a `toddler` age group and expanded baby/toddler items — `toddlerEssentials.ts`, `babyFamilyGear.ts`, and three new injection blocks in `generatePackingPlan` |
| `2026-08-06-location-weather-lookup.md` | Plan (1,674 lines) for Open-Meteo location search and weather-driven climate in Wizard Step 1: a provider-agnostic `src/services/weather/` layer behind `IGeocodingProvider` / `IWeatherProvider` |
| `2026-08-11-website-backend.md` | Plan (2,250 lines) for a **new, separate** Symfony 7 / PHP 8.4 / Postgres 16 repo, `packmyholiday-backend`: public site, `/admin`, versioned `/api/v1`, Docker deploy to Hetzner. Not implemented in this repo |
| `2026-10-28-lagoon-sun-integration.md` | Plan to integrate the Lagoon & Sun UI overhaul bundle: file review, dependency swap, verification, and the `.context` update list |

## Specs (`docs/superpowers/specs/`)
| File | Covers |
|---|---|
| `2026-08-06-baby-toddler-items-design.md` | Problem and goal for separating `toddler` from `infant` and covering clothing, diapering, feeding, travel gear and health essentials for ages 0–3 |
| `2026-08-06-location-weather-lookup-design.md` | Goals for an adapter-driven service layer, a free Open-Meteo provider, forecast vs archive weather by trip distance, and manual climate fallback on failure |
| `2026-08-07-item-exclude-and-checkbox-fix-design.md` | Design for excluding/removing packing items from the weight budget, and the iOS fix for the invisible unchecked checkbox (Paper's `CheckboxIOS` renders unchecked at zero opacity) |
| `2026-08-11-website-backend-design.md` | Design for the separate backend: app-store privacy-policy site, admin-managed `PackingItem` catalog served by a public read-only `GET /api/v1/items`, double opt-in `BetaRequest` flow, seeding from this repo's catalogs. States the packing-quantity rules engine stays client-side |
