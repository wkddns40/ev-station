# ADR 001 — Vite over Create React App

## Status

Accepted (2026-05-15). Implemented in Phase 2b. Locked under REFACTOR_PLAN.md §12 D1.

## Context

The legacy app shipped on `react-scripts` 5.x (Create React App). By 2024 CRA was effectively deprecated — no new releases, no fix for the 70-finding `npm audit` baseline it ships with, and dev-server reload was multi-second on a 600-line single-file React app. The new strict-TypeScript codebase needed:

- Fast HMR (≤200 ms) so the typecheck/iterate loop is tight.
- `npm audit` clean so the security badge on the README isn't a lie.
- A modern config surface (ES modules, `vite.config.js`, plugin API) so things like `manualChunks` and per-env build flags aren't fights.
- First-party Vitest integration so test runner / build / dev server share the same transform.

## Decision

Migrate to Vite 5 with `@vitejs/plugin-react`. JSX-in-`.js` files keep working during the JS → TS transition via an esbuild loader shim (removed once everything is renamed to `.tsx`).

## Consequences

**Positive**

- Dev server boot drops from ~6 s to ~500 ms; HMR is sub-200 ms on a clean save.
- `npm audit` drops from 70 findings (3 critical, 30 high) to 8 (0 critical, 2 high) just by removing `react-scripts` and its transitive zoo.
- Test runner (Vitest) reuses the Vite config and transform pipeline — no separate Jest + Babel + ts-jest stack to maintain.
- `vite.config.js` lets us declare per-vendor `manualChunks` directly (split `deckgl` / `maplibre` / `react` / `query` for cache wins).
- Vercel detects the Vite preset automatically; the only override needed is `installCommand: npm ci --legacy-peer-deps` (Vitest 4's vite-7 peer dep).

**Negative**

- One-time JSX-in-`.js` shim needed in `vite.config.js` until Phase 2c renamed every file to `.tsx`.
- ESLint config had to be rewritten as flat config (eslint v9+), which is the new standard but unfamiliar to anyone coming from `.eslintrc`.
- Vitest 4 has a peer dep on `vite@^6 || ^7 || ^8` but the app stays on Vite 5 (the React 18 + deck.gl + maplibre validation matrix is anchored there); requires `--legacy-peer-deps` on install. Tracked separately; upgrading the whole stack to Vite 7 is a Phase 6 item.
- `import.meta.env` instead of `process.env` — all `REACT_APP_*` env vars had to be renamed to `VITE_*`.

## Alternatives considered

- **Stay on CRA.** Rejected — deprecated, no upgrade path, can't get to 0 critical audit findings without forking.
- **Next.js.** Rejected — full SSR/SSG framework is overkill for a single-page WebGL dashboard. The migration cost (file-system routing, server components, layout files) outweighs any benefit; the demo's static-snapshot model already gives us CDN caching without needing SSG.
- **esbuild directly + a hand-rolled dev server.** Rejected — Vite's `@vitejs/plugin-react` plus the plugin ecosystem (`vitest`, `vite-tsconfig-paths`, etc.) is a strict superset of what we'd hand-roll.
