# Stack (canonical)

> Filled in during stage `01_overview`, after the human confirmed the
> Checkpoint in `stages/01_overview/CONTEXT.md`. This is the only home for
> these facts — every other stage references this file, none re-derives it.

- **Primary language:** TypeScript (strict mode; `tsconfig.json` extends `expo/tsconfig.base`). Plain JavaScript only for config/tooling (`jest.config.js`, `scripts/generate-assets.js`).
- **Framework:** Expo SDK 54 (`expo ^54.0.0`) on React Native 0.81.5 and React 19.1.0. UI kit `react-native-paper ^5.15.3`; client state `zustand ^5.0.14`, persisted with `@react-native-async-storage/async-storage 2.2.0`. Web target via `react-native-web ^0.21.0` / `react-dom 19.1.0`. Tests: `jest-expo ~54.0.17` + `@testing-library/react-native ^14`.
- **App directory:** `.` (repo root). Entry is `index.ts` → `App.tsx`; source is under `src/`.
- **Dev environment:** No Docker/Lando/devcontainer. Node `24.19.0` (`.nvmrc`); run with `expo start` (`npm start`, `npm run ios|android|web`); tests with `npm test` (`jest`). Native builds via EAS (see `stages/01_overview/output/environment.md`).
- **Database(s):** None. No backend or SQL in this repo; persistence is client-side AsyncStorage only (see `stages/03_data/output/`).
- **Excluded / vendored directories:** `node_modules/`, `.expo/`, `.superpowers/`, `.claude/`, `.agents/`, `.context/`, and `.envrc` (personal `CLAUDE_CONFIG_DIR` only).

## Reasoning

`package.json` is the only language manifest in the repo (no `composer.json`, `pyproject.toml`, `Gemfile`, `go.mod` or `Cargo.toml`), and its content — `expo`, `react-native`, `jest-expo`, `@expo-google-fonts/*` — agrees with `app.json` (Expo config, `ios`/`android` bundle IDs `com.packmyholiday`), `eas.json` (EAS build profiles) and the `src/` layout (RN components/screens). No manifest was discounted. The `docs/superpowers/` specs describe a planned website and backend, but no such code exists in this repo.
