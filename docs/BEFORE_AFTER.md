# Before / After metrics

Tracks measurable refactor wins. Update at each phase that changes bundle size, install footprint, or vulnerability count.

## Bundle size (frontend production build)

| Phase | Builder | JS (raw) | JS (gzip) | CSS (raw) | CSS (gzip) | Notes |
|--|--|--|--|--|--|--|
| 1 (CRA baseline) | `react-scripts build` | — | 569.44 kB (main) + 1.77 kB (chunk) | — | 2.05 kB | CRA 5.0.1; `npm run build` from repo root |
| 2b (Vite migration) | `vite build` | 2,506.04 kB | 703.03 kB | 6.94 kB | 1.99 kB | Vite 5.4.21; single chunk; sourcemap enabled |

**Phase 2b commentary:** Vite single-chunk gzip is +133 kB vs CRA's chunked main+chunk. Bundle larger because:
1. Vite does not chunk by default (single `index-*.js`), while CRA splits into `main.*.js` + `787.*.chunk.js`.
2. Vite includes the `react-sliding-pane` CSS inside the JS bundle by default, while CRA emitted it as separate CSS.

Phase 2h (deck.gl layer memoization + code-split) is expected to bring gzip below the Phase 1 baseline.

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
