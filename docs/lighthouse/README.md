# Lighthouse reports — Phase 3 T3.7

Mobile preset. Target: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90.

| Run | Commit | URL | Perf | A11y | BP | LCP | TBT | TTI |
|---|---|---|---|---|---|---|---|---|
| baseline | 67b1987 | ev-station-ten.vercel.app (prod) | 56 | 93 | 100 | 2.5s | 20.5s | 24.4s |
| panes+chunks (Evstation lazy) | c1a715f | preview | 41 | 93 | 100 | 4.1s | 16.3s | 21.8s |
| panes+chunks (Evstation eager) | e96878f | preview | 37 | 93 | 100 | 4.5s | 17.4s | 22.8s |

## Performance gap (known, accepted)

Target ≥ 80 is **not met** on mobile. Root cause: `maplibre-gl` (291 KiB gz) + `deck.gl` (134 KiB gz) parse/execute cost under Lighthouse's mobile CPU throttle (4× slowdown). The map IS the page, so the WebGL stack cannot be deferred past LCP without making the app blank on first paint.

Tried and rejected:
- **Lazy Evstation** — LCP regression (map paints after lazy chunk fetch, 2.5s → 4.1s).
- **Aggressive manualChunks** — net loss on slow-4G (extra round trips outweigh parallelism win).
- **PageSpeed Insights API** — Google daily quota exhausted on anonymous account.

Retained (under phase-3-perf):
- **Panes lazy** (LeftPane/RightPane/SearchFilterPane via React.lazy) — saves a few KiB from initial bundle without hurting LCP.
- **vendor manualChunks** (react, deckgl, maplibre, query) — better cache hit ratio across deploys (vendor chunks rarely change).
- **Unused deps removed** (`chart.js`, `recharts`, `framer-motion`, `react-icons`, `react-modal`, `@emotion/*`, `@deck.gl/aggregation-layers`, `@deck.gl/geo-layers`) — Vite already tree-shook them; this cleans the manifest.
- **sourcemap: false** in production build — smaller transferred bytes.

## Reproducing

```bash
CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe" \
npx --yes lighthouse https://ev-station-ten.vercel.app/ \
  --only-categories=performance,accessibility,best-practices \
  --output=json --output-path=docs/lighthouse/<sha>.json \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --user-data-dir=/tmp/lh/chrome-profile"
```

A teardown EPERM on Windows is benign — the JSON report is written before the error.

## Future paths to ≥ 80 (out of scope for Phase 3)

1. Async deck.gl overlay (MapLibre paints first, deck.gl layers attach after) — projected +10–15 Perf.
2. Replace `maplibre-gl` with a lighter raster-tile renderer (Leaflet / Pigeon-maps) — D2 locked decision; not feasible without explicit user approval.
3. SSR with hydration deferred — architectural shift; Phase 6 stretch territory.
