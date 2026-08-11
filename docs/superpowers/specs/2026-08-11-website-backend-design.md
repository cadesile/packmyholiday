# Take My Holiday — Website & Backend Design

## Purpose

App store compliance (Google Play/iOS) requires a hosted privacy policy and, longer-term, a public presence for the "Take My Holiday" app. This project builds a single Symfony application that (1) serves a public single-page marketing/privacy-policy/contact site, and (2) provides an admin-managed API the mobile app fetches packing item content from on boot.

This is a **new, separate repository** (`packmyholiday-backend`), not part of this React Native app repo. This app repo (`packmyholiday`) is referenced only as the source of the initial packing-item seed data.

## Non-goals

- Reimplementing the app's packing-quantity rules engine (`src/utils/packingEngine.ts`: per-traveler formulas, `appliesWhen` climate/activity gating). That logic stays entirely client-side. The backend manages a flat, editable *content* catalog only.
- User accounts / login for the mobile app. The API's item endpoint is public, read-only, unauthenticated.
- Manual beta approval workflow. Beta access is granted automatically via double opt-in.

## Architecture

One Symfony (PHP 8.4) application, one Postgres 16 database, one deployable Docker image — no separate frontend build, no microservices.

- **Public site** — Twig templates served at `/`.
- **Admin** — Symfony controllers at `/admin`, protected by HTTP Basic Auth.
- **API** — JSON endpoints at `/api/v1/...`, versioned so future endpoints (mentioned as a known future requirement) can be added without breaking the mobile app's existing integration.

Modeled on the `wunderkind-backend` repo's conventions (PHP 8.4-fpm-alpine + nginx + supervisor Docker image, Lando `symfony` recipe locally, Hetzner deploy via GitHub Actions) but trimmed: no JWT, no social-auth integrations, no cron jobs — none of that applies here.

## Data model

### `PackingItem`
| Field | Type | Notes |
|---|---|---|
| `id` | int (PK) | |
| `name` | string | e.g. "T-Shirt / Top" |
| `type` | enum | `luggage \| clothing \| toiletries \| electronics \| footwear \| essentials` — mirrors the app's existing `PackingItem['category']` union |
| `weightGrams` | int | single reference weight, not per-traveler-scaled |
| `climate` | enum | `warm \| cold \| temperate \| any` — `any` means climate-independent |
| `active` | bool | soft toggle; inactive items are excluded from `GET /api/v1/items` but retained for admin history |
| `createdAt` / `updatedAt` | datetime | |

### `BetaRequest`
| Field | Type | Notes |
|---|---|---|
| `id` | int (PK) | |
| `email` | string | |
| `status` | enum | `pending \| confirmed` |
| `confirmationToken` | string | random, unique, generated on creation |
| `requestedAt` | datetime | |
| `confirmedAt` | datetime, nullable | |

## Public site (`/`)

Single Twig template (`templates/site/home.html.twig`) rendered server-side, no Node build step — Symfony AssetMapper + Stimulus for the contact form's fetch submission (with a plain-POST fallback so it works without JS).

Sections:
1. Hero + high-level feature overview (static copy, editable in the template).
2. Privacy policy (`templates/site/_privacy_policy.html.twig` partial, so legal copy can be edited independently of layout).
3. Contact form — collects name/email/message, submits to `POST /contact`, sends via Symfony Mailer to a configured recipient address. Separate from the beta-request flow.
4. Beta access form — collects email, submits to `POST /api/v1/beta-requests` (see Beta flow below).

Layout uses a CSS custom property (`--logo-url` or an `{% if logo asset exists %}` Twig check) for the logo slot, so the final logo can be dropped in without a layout change once branding is ready.

## Admin (`/admin`)

HTTP Basic Auth, single shared credential pair from environment variables (`ADMIN_USER` / `ADMIN_PASSWORD_HASH`), matching the env-var-driven secrets pattern used in `wunderkind-backend`.

Custom Symfony controllers + `FormType` classes (no EasyAdminBundle) for `PackingItem`:
- `GET /admin/items` — list, filterable by type/climate/active.
- `GET/POST /admin/items/new` — create.
- `GET/POST /admin/items/{id}/edit` — edit.
- `POST /admin/items/{id}/delete` — delete (or deactivate — deactivate is preferred since `active` exists; keep a genuine delete for mistakes).

## API (`/api/v1`)

- `GET /api/v1/items` — public, unauthenticated, read-only. Returns active items as JSON. Optional query params `?type=` and `?climate=` for filtering. This is what the mobile app fetches on boot and caches locally.
- `POST /api/v1/beta-requests` — public. Body: `{ email }`. Creates a `BetaRequest` (or reuses an existing pending one for the same email) and triggers the confirmation email. Rate-limited/duplicate-guarded by email uniqueness.

Versioning under `/v1` from day one is the only scalability provision needed now — new endpoints (e.g. future content types) are added as siblings under `/api/v1/` or bumped to `/v2` only on breaking changes.

## Beta validation flow (double opt-in)

1. User submits email (via site form or `POST /api/v1/beta-requests`).
2. Server creates `BetaRequest{status: pending, confirmationToken}`, emails a confirmation link (`https://.../beta/confirm/{token}`) via Symfony Mailer.
3. User clicks the link → `GET /beta/confirm/{token}` → validates token, sets `status: confirmed`, `confirmedAt: now`, shows a success page.
4. No admin step. A confirmed `BetaRequest` is the record of granted beta access (how that access is actually delivered — e.g. TestFlight/Play Console invite — is a manual step outside this system for now, since it's a one-time low-volume action).

Invalid/expired/already-confirmed tokens on `GET /beta/confirm/{token}` show a friendly error page rather than a 404/500.

## Seed data

A one-time Doctrine command (`app:seed-items`) loads `PackingItem` rows from a JSON fixture. That fixture is hand-generated once (not an automated build step) by flattening this repo's `src/data/itemCatalog.ts`, `infantEssentials.ts`, `toddlerEssentials.ts`, and `babyFamilyGear.ts`:

- `name` → `name`
- `category` → `type`
- `baseWeightGrams` → `weightGrams`
- climate → inferred from each entry's `appliesWhen` climate gate (e.g. `ctx.config.climate === 'cold'` → `cold`); entries with no climate gate → `any`

The command is idempotent (upsert by `name`), so it's safe to run on every deploy per the `wunderkind-backend` pattern (`doctrine:migrations:migrate` followed by seed commands).

## Local development

Lando, `symfony` recipe, PHP 8.4, Postgres 16 — same shape as `wunderkind-backend/.lando.yml`, minus the JWT-key-generation `post-start` event (not needed here).

## Deployment

- Docker image: `php:8.4-fpm-alpine` + nginx + supervisor, built and pushed to `ghcr.io/<org>/packmyholiday-backend:prod`.
- GitHub Actions workflow on push to `main`: build/push image → SCP `docker-compose.prod.yml` to the Hetzner host → SSH in and run `docker compose pull && up -d`, `doctrine:migrations:migrate --no-interaction`, `app:seed-items`, `cache:clear`.
- `docker-compose.prod.yml`: `app` + `postgres-prod` (persistent volume) + `certbot` sidecar for TLS renewal — directly ported from `wunderkind-backend`'s compose file, with the JWT/social-auth environment variables removed and `MAILER_DSN`/`MAILER_FROM`/`MAILER_FROM_NAME`/`ADMIN_USER`/`ADMIN_PASSWORD_HASH` kept/added.
- Secrets (`DB_PASSWORD`, `APP_SECRET`, `MAILER_DSN`, admin credentials) supplied via GitHub Actions secrets, written to a server-side `.env` at deploy time — same mechanism as `wunderkind-backend`.

## Testing

- PHPUnit unit tests: `PackingItem`/`BetaRequest` entity and repository behavior; beta token generation and confirmation state transitions.
- Functional tests: `GET /api/v1/items` (filtering, active-only), `POST /api/v1/beta-requests` (creation, duplicate email handling), `GET /beta/confirm/{token}` (valid/invalid/expired paths), admin CRUD screens (behind Basic Auth), contact form submission.

## Open items intentionally deferred

- Final logo/branding — layout leaves an explicit slot; not blocking.
- Delivery mechanism for actual beta access (TestFlight/Play Console invite) after `BetaRequest` confirmation — manual for now, low volume.
- Additional future API endpoints beyond items — versioning scheme accounts for this; no further design needed until a concrete endpoint is requested.
