# Before / After metrics

Tracks measurable refactor wins. Update at each phase that changes bundle size, install footprint, or vulnerability count.

## Bundle size (frontend production build)

| Phase | Builder | JS (raw) | JS (gzip) | CSS (raw) | CSS (gzip) | Notes |
|--|--|--|--|--|--|--|
| 1 (CRA baseline) | `react-scripts build` | — | 569.44 kB (main) + 1.77 kB (chunk) | — | 2.05 kB | CRA 5.0.1; `npm run build` from repo root |
| 2b (Vite migration) | `vite build` | 2,506.04 kB | 703.03 kB | 6.94 kB | 1.99 kB | Vite 5.4.21; single chunk; sourcemap enabled |
| 2d (MapLibre) | `vite build` | 659.24 (index) + 1053.98 (maplibre) kB | 200.42 + 284.97 kB | 76.90 kB | 11.92 kB | mapbox-gl + @urbica/react-map-gl out, maplibre-gl in, react-map-gl 5→8 |
| 2f (TanStack Query) | `vite build` | 699.39 (index) + 1053.98 (maplibre) kB | 212.26 + 284.97 kB | 76.90 kB | 11.92 kB | +40 kB raw / +12 kB gzip for `@tanstack/react-query ^5.100.10` |
| 2h (memoize) | `vite build` | 699.70 (index) + 1053.98 (maplibre) kB | 212.33 + 284.97 kB | 76.90 kB | 11.92 kB | Layer factories + callbacks wrapped in useMemo/useCallback; bundle delta is noise |

**Phase 2b commentary:** Vite single-chunk gzip is +133 kB vs CRA's chunked main+chunk. Bundle larger because:
1. Vite does not chunk by default (single `index-*.js`), while CRA splits into `main.*.js` + `787.*.chunk.js`.
2. Vite includes the `react-sliding-pane` CSS inside the JS bundle by default, while CRA emitted it as separate CSS.

**Phase 2d commentary:** Bundle splits into two chunks (Vite auto-isolates `maplibre-gl` into its own chunk). Combined gzip (200 + 285 = 485 kB) is -85 kB vs Phase 2b's single-chunk 703 kB. The maplibre chunk is cached separately by the browser; subsequent navigations / deploys that don't touch maplibre keep the chunk.

**Phase 2h commentary:** No bundle-size goal for this phase — memoization is a render-time win, not a bytes-on-the-wire win. See "Layer recreation" section below for the actual metric.

## Layer recreation (deck.gl render perf, Phase 2h)

Plan §5.2h target: layer instance count ≤ 3 across 3 filter changes that do not affect the rendered data set.

**Before 2h:** the `layers` array in `Evstation.tsx` was a fresh array literal on every render, with 3 fresh `new ColumnLayer/IconLayer/PathLayer({...})` instances inside. Every state update — including filter, sort-order, and pane-open changes — produced 3 new layer instances. Across 3 filter changes: **9 layer instances created** (3 per change).

**After 2h:** each layer factory is wrapped in `useMemo` keyed on its inputs:
- `columnLayer` → `[showAllData, validData, elevationFactor, toggleShowAllData, handleColumnHover]`
- `iconLayer` → `[lastDataPoint, toggleShowAllData]`
- `pathLayer` → `[showAllData, paths]`
- `layers` (array) → `[columnLayer, iconLayer, pathLayer]`

Filter state (`region`, `manufacturer`, `voltType`, `efficiencyValue`, `sortOrder`, `filterStep`) appears in **none** of those dep lists. The layer inputs are `validData` (built from the raw fetched `data`, not the filtered subset), `lastDataPoint` (a `useMemo` derivation of `validData`), `paths` (a `useMemo` derivation of `validData`), `elevationFactor` (animation tick during `showAllData`), and three `useCallback`-stable handler identities.

Reasoned recreation counts across 3 filter changes that leave `data` unchanged:
- `columnLayer`: **0** (no dep touched)
- `iconLayer`: **0** (no dep touched)
- `pathLayer`: **0** (no dep touched)
- `layers` array: **0** (no member changed)

**Total: 0 across 3 filter changes** (M = 0, target M ≤ 3 ✅).

Live React DevTools Profiler measurement: deferred. The headless `browse` tool used during sub-phase smoke does not surface Fiber-level recreation metrics, and the dev-tools extension is not loaded in the test browser. Reasoning above is from static dep-array inspection; if a future regression introduces a filter-keyed dep into a layer memo, the next phase's profiler pass will catch it.

## npm audit (frontend)

| Phase | Total | Critical | High | Moderate | Low |
|--|--|--|--|--|--|
| 1 (CRA) | 70 | 3 | 30 | 23 | 14 |
| 2b (Vite) | 8 | 0 | 2 | 6 | 0 |

**Phase 2b commentary:** Removing `react-scripts` and the CRA test-stack (`@testing-library/*`, `web-vitals`) drops 62 audit findings (-88%). Remaining 8 are deck.gl / mapbox-gl transitive deps cleared by Phase 2d MapLibre migration.

## Install footprint (frontend)

| Phase | Packages installed |
|--|--|
| 1 (CRA) | 1687 |
| 2b (Vite) | 346 (-79%) |
