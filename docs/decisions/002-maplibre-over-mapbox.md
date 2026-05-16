# ADR 002 — MapLibre over Mapbox

## Status

Accepted (2026-05-15). Implemented in Phase 2d. Locked under REFACTOR_PLAN.md §12 D2.

## Context

The legacy app used Mapbox GL JS with a hardcoded access token committed to the repo's public history. Two problems:

1. **Leaked secret.** The token was already public; rotating it was the absolute minimum. Phase 0 force-rotated the token and made the repo private temporarily before public re-publish.
2. **Mapbox's pricing.** Free tier moved to 50k loads/month with stricter validation in 2024. A portfolio demo isn't worth a billing risk.

We needed a tile source that:

- Doesn't require an API key in the client bundle.
- Renders the same vector-tile style the app already targets (deck.gl overlay sits on top).
- Supports the same `MapLibre`/`Mapbox` API surface so the JS code barely changes.

## Decision

Switch to **MapLibre GL** (the OSS fork of Mapbox GL before its license changed) with **OpenFreeMap Liberty** tiles.

- `npm uninstall mapbox-gl @urbica/react-map-gl`
- `npm install maplibre-gl react-map-gl@latest` (react-map-gl 8 supports MapLibre via `react-map-gl/maplibre` subpath)
- `MAP_STYLE_URL` = `https://tiles.openfreemap.org/styles/liberty`
- Delete `MapboxGL.accessToken` line entirely

## Consequences

**Positive**

- Zero API keys anywhere in the client bundle or env. The deployed `dist/` is auditable and reproducible.
- One-line style URL swap is the entire fallback story — if OpenFreeMap ever goes down, point `MAP_STYLE_URL` at MapTiler / Stadia / self-host. Single point of change in `frontend/src/constants/viewport.ts`.
- `maplibre-gl` has TypeScript types out of the box (Mapbox GL's types were maintained separately and lagged).
- react-map-gl 8's subpath imports (`react-map-gl/maplibre`) keep the bundle from pulling Mapbox-only code paths.

**Negative**

- OpenFreeMap is community-funded; uptime SLA is informal. Acceptable for a portfolio demo, NOT acceptable for a production product. Production code should plan for MapTiler ($) or self-hosted tiles.
- Vector style differs slightly from Mapbox's defaults — some font fallbacks render differently for Korean labels. Visually fine; not pixel-identical to the legacy screenshots.
- react-map-gl 8 split into subpath packages; every `Map`/`Marker`/`Popup`/`Source`/`Layer` import has to come from `react-map-gl/maplibre` (not the bare `react-map-gl` root).
- `ButtonGroup`'s `NavigationControl` (rendered with `showCompass=false showZoom=false` — a visual no-op since Phase 0) was deleted; react-map-gl 8 requires a `<Map>` ancestor context which `ButtonGroup` doesn't have.

## Alternatives considered

- **Rotate the Mapbox token, stay on Mapbox.** Rejected — recurring secret-management cost, still have a public-token-as-config anti-pattern, billing exposure.
- **MapTiler.** Considered as a paid drop-in for OpenFreeMap. Held as the documented fallback (`viewport.ts` style URL is a one-line swap). Free tier exists but caps too low for honest portfolio traffic.
- **Self-host vector tiles.** Rejected — the storage + bandwidth + tile-server ops are out of proportion to the demo's value.
- **Leaflet + raster tiles.** Rejected at the planning stage — the app's overlay is deck.gl WebGL, which composes natively with MapLibre's WebGL canvas. Raster + Canvas2D overlay would mean rewriting all three deck.gl layers.

## Performance note

On mobile Lighthouse, MapLibre's WebGL bundle (1071 KB raw / 291 KB gzip) is the single biggest perf cost. We tried lazy-loading the map shell to recover LCP; reverted because the map *is* the LCP element. Recorded in [`docs/lighthouse/README.md`](../lighthouse/README.md). If Phase 6 picks "real-time performance" as a stretch goal, replacing MapLibre with a lighter renderer (raster + Canvas2D) is the lever — but it requires also replacing the deck.gl overlay path.
