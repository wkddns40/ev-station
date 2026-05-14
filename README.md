# EV-STATION

Real-time EV charging station dashboard for Korea with WebGL-accelerated geospatial visualization.

> 🇰🇷 한국어 README: [`README.ko.md`](README.ko.md)

## Status

**Active refactor in progress.** This repository is being migrated to a modern stack:

- React 18 + TypeScript (full strict) + Vite
- deck.gl WebGL rendering with MapLibre + OpenFreeMap tiles
- Flask backend with env-loaded config and connection pooling
- Vitest + pytest + GitHub Actions CI
- Live demo on Vercel with static mock data

The full plan, phase atomic tasks, locked decisions, and verification checkboxes live in `REFACTOR_PLAN.md` at the repository root.

## Pre-refactor state

The pre-refactor source is preserved on the `legacy` branch and the signed `v0-legacy` tag.

```
git fetch origin
git checkout legacy
```

## License

MIT — see [`LICENSE`](LICENSE).
