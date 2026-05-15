# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Basemap migrated from **Mapbox GL JS** to **MapLibre GL JS** (`maplibre-gl ^5.24.0`) with tiles served from **OpenFreeMap Liberty** style (`https://tiles.openfreemap.org/styles/liberty`); no API key required (Phase 2d, §5, D2)
- `react-map-gl` upgraded **5.1.5 → 8.1.1**; `InteractiveMap` (v5) replaced with `Map` from `react-map-gl/maplibre` subpath; deprecated `preventStyleDiffing` and `mapboxApiAccessToken` props removed (Phase 2d)
- `frontend/src/constants/viewport.ts` introduced — `MAP_STYLE_URL` constant + `INITIAL_VIEW_STATE` extracted from `Evstation.tsx` (Phase 2d)
- `maplibre-gl/dist/maplibre-gl.css` imported in `Evstation.tsx` for navigation/attribution control styling (Phase 2d)

### Removed
- `mapbox-gl` and `@urbica/react-map-gl` dependencies (Phase 2d)
- `VITE_MAPBOX_TOKEN` and `VITE_MAPBOX_STYLE_URL` from `frontend/src/vite-env.d.ts` and `frontend/.env.example` — basemap no longer requires a token (Phase 2d, D2)

### Changed
- All frontend source converted from JavaScript to **TypeScript with full strict mode** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`); `frontend/tsconfig.json` + `frontend/tsconfig.node.json` added; `npx tsc --noEmit` exits 0 (Phase 2c, §5)
- `frontend/src/index.js` → `frontend/src/main.tsx`; `frontend/src/evstation.js` → `frontend/src/Evstation.tsx` (capitalized to match component name); `ButtonGroup`, `LeftPane`, `RightPane`, `SearchFilterPane`, `ToolTip`, `PublishingPage` renamed to `.tsx`; `searchTerms` to `.ts` (Phase 2c)
- `frontend/index.html` script tag updated `/src/main.jsx` → `/src/main.tsx` (Phase 2c)
- `frontend/vite.config.js` esbuild JSX-in-`.js` loader shim removed (no longer needed; all source is `.tsx`/`.ts`) (Phase 2c)
- `SearchFilterPane` region-zoom handler dead-branch logic simplified (TS flagged `hasZoomedIn === 'jeju'` after a `!== 'seoul_gyeongin'` narrowing as an impossible-overlap comparison) (Phase 2c)

### Added
- `frontend/src/types/charger.ts` — `ChargerProperties`, `ChargerFeature`, `FeatureCollection` domain types (Phase 2c)
- `frontend/src/types/filters.ts` — `FilterState`, `SortOrder`, `ViewState`, `ZoomTarget` + `emptyFilterState` constant (Phase 2c)
- `frontend/src/vite-env.d.ts` — `ImportMetaEnv` typing for `VITE_*` vars + module shims for `*.css` and untyped deck.gl packages (Phase 2c)

### Removed
- `frontend/src/index.js`, `frontend/src/evstation.js`, and the legacy `.js` companions (replaced by `.tsx` versions) (Phase 2c)

### Changed
- Frontend build tool migrated from Create React App (`react-scripts` 5.0.1) to **Vite 5.4.21** with `@vitejs/plugin-react`; new `frontend/vite.config.js`, root-level `frontend/index.html` with `<script type="module" src="/src/main.jsx">`, package.json switched to `type: "module"` and the `dev`/`build`/`preview`/`lint`/`typecheck`/`test` script set (Phase 2b, §5)
- All `process.env.REACT_APP_*` references replaced with `import.meta.env.VITE_*` (Mapbox token, Mapbox style URL, API base URL); `frontend/.env` and `frontend/.env.example` keys renamed accordingly (Phase 2b)
- `process.env.PUBLIC_URL` in `iconAtlas` replaced with the absolute path `/car.png` (Vite serves `public/` at the site root) (Phase 2b)
- `frontend/src/index.js` → `frontend/src/main.jsx` (Vite entry-point convention) (Phase 2b)
- Repo restructured into `frontend/` (CRA app: `src/`, `public/`, `package.json`, `package-lock.json`, `.env`, `.env.example`) and `backend/` (Flask: `charger_api.py`, `mock_server.py`, `fixtures/`, `requirements.txt`, `.env.example`); empty `api/` and root `src/` removed (Phase 2a, §5)
- `.env.example` split into `frontend/.env.example` (`REACT_APP_*` keys) and `backend/.env.example` (`DB_*`, `FLASK_*`, `CACHE_TTL_SECONDS`); both gitignore-tracked siblings of their respective `.env` (Phase 2a)

### Removed
- `react-scripts`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `web-vitals`, and the `browserslist` / `eslintConfig` blocks from `frontend/package.json` (CRA-only; Vitest + Vite handle their replacements; Phase 4 will add the test stack) (Phase 2b)
- `frontend/src/reportWebVitals.js` and `frontend/src/setupTests.js` (CRA-only; Phase 2b)
- `frontend/public/index.html` (replaced by Vite-root `frontend/index.html`) (Phase 2b)

### Added
- `docs/BEFORE_AFTER.md` tracking bundle size, npm audit counts, and install footprint across phases (Phase 2b)

### Added
- `src/__tests__/regression.test.js` with `xit` stubs for B3, B4, B5, B6 (Phase 4 activates) (T1.10)
- `api/mock_server.py` + `api/fixtures/chargers.geojson` for headless Phase 1 smoke testing without MySQL (T1.11)
- `.gitignore` covering Node/Python/OS/IDE/env/logs artifacts (T0.3, D6)
- `.env.example` documenting frontend `REACT_APP_*` and backend `DB_*` / `FLASK_*` keys (T0.4, D6)
- `LICENSE` (MIT, `Copyright (c) 2026 wkddns40`) (T0.8, D8)
- `api/requirements.txt` with pinned backend deps (T0.7c)
- `.github/pull_request_template.md` (T0.1h2–h3, D10)
- English `README.md` stub linking to `REFACTOR_PLAN.md`; original Korean README preserved as `README.ko.md` (T0.9, D7)

### Changed
- Data fetch runs once on mount; `validData` and `filteredResults` derived via `useMemo` instead of refetching on every filter change (T1.9)
- Frontend secrets externalized to `process.env.REACT_APP_*`: Mapbox token, data URL, icon atlas path, API base URL (T0.5, D6)
- Backend DB credentials read from `os.environ['DB_*']` via `python-dotenv` (T0.6, D6)
- Flask `debug` gated behind `FLASK_ENV == 'development'`; default host bound to `127.0.0.1` (was `0.0.0.0`); port read from `FLASK_PORT` (T0.7a–b)
- Repo-scoped Git identity set to `wkddns40 <wkddns40@gmail.com>` (T0.1f2, D9)
- Repo-scoped SSH commit + tag signing enabled with ed25519 key (T0.1f3–f6, D11)

### Fixed
- Map feature access: `data.feature` → `data.features` (B1, T1.1)
- IconLayer mapping: `iconMevstationing` typo → `iconMapping` (B2, T1.1)
- Filter pipeline rewritten as composed predicates; broken `if/else` branches removed (B3, T1.2)
- Efficiency filter treats `0` as a valid value, not falsy-skipped (B4, T1.3)
- CSV export loop iterates full `selectedPropertiesData.length` (B5, T1.4)
- `handleHomeClick` + `SearchFilterPane` reset paths initialize `selectedFilters` as object shape, not array (B6, T1.5)
- Placeholder title `"TEST PathLayer"` → `"EV Station Dashboard"` (B7, T1.6)
- Root component binding capitalized so React renders `<Evstation />` instead of treating it as an unknown HTML tag (B9; discovered during T1.11 smoke)
- `setEfficiencyValues` no longer drops `0` via `.filter(Boolean)`, so the efficiency dropdown can surface 0 (B4 follow-up; discovered during T1.11 smoke)

### Removed
- Commented-out `useState`/`useEffect` blocks and dead helpers (`toggleMapStyle`, `updateTheme`, `objectToRow`, etc.) (T1.8)
- All `eslint-disable-next-line` markers in `src/evstation.js` (T1.8c)

### Security
- Removed hardcoded Mapbox access token, `iptime.org:5000` API host, `127.0.0.1:5500` icon path, and `mapbox://styles/djangbogo/...` style URL from source (T0.5, D6)
- Removed hardcoded MySQL host/user/password/database from `api/charger_api.py` (T0.6, D6)
- `gitleaks v8.30.1` full-history scan: 77 commits, no leaks found (T0.2)
- `legacy` branch + signed `v0-legacy` tag preserve pre-refactor baseline before public exposure (T0.1g)
