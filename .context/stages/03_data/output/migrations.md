# Migrations

There are no database migrations, migration files or migration tooling in this repo (no database exists — see `../../../shared/stack.md`).

The only versioning is the AsyncStorage payload in `src/state/storage.ts`:
- `CURRENT_SCHEMA_VERSION = 1`, written as `schemaVersion` by `persistSavedTrips`.
- `migrate(raw)` is a deliberate no-op: it returns `raw.trips` when that is an array, otherwise `[]`. Its comment says future format changes should add version-specific branches there.
- `schemaVersion` is never read, so a future change to `SavedTrip`/`TripConfig`/`PackingPlan` must add that read before relying on it; until then saved trips written by older builds are loaded as-is.

History: the persisted shape has been version 1 since the first build; git shows no earlier version.
