# EV-STATION

Real-time EV charging station dashboard for Korea with WebGL-accelerated geospatial visualization.

[![CI](https://github.com/wkddns40/ev-station/actions/workflows/ci.yml/badge.svg)](https://github.com/wkddns40/ev-station/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A570%25-brightgreen)](frontend/vitest.config.ts)
[![Live demo](https://img.shields.io/badge/demo-ev--station--ten.vercel.app-blue?logo=vercel)](https://ev-station-ten.vercel.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](frontend/tsconfig.json)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite)](frontend/vite.config.js)

> 🇰🇷 한국어 README: [`README.ko.md`](README.ko.md)

## Live demo

**👉 [ev-station-ten.vercel.app](https://ev-station-ten.vercel.app/)** — runs in demo mode against a 400-feature static snapshot (`frontend/public/sample-chargers.json`). No backend required.

![Default map view](docs/screenshots/01-default-view.png)

## Features

| | |
|---|---|
| ![Seoul zoom](docs/screenshots/02-seoul-zoom.png) | ![Jeju zoom](docs/screenshots/03-jeju-zoom.png) |
| Region zoom — Seoul / 경기·인천 / Jeju | One-tap viewport presets |
| ![Search filter pane](docs/screenshots/04-search-filter-pane.png) | ![Info pane](docs/screenshots/05-info-pane.png) |
| Cascading filters (region → manufacturer → 계량기 → efficiency) | Stats summary (avg / min / max) + CSV download |

## Stack

- **Frontend:** React 18 + TypeScript (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) + Vite
- **Map:** MapLibre GL + OpenFreeMap Liberty tiles (no API key)
- **Overlay:** deck.gl (ColumnLayer + IconLayer + PathLayer)
- **State:** `useReducer` + Context (filters), TanStack Query (data)
- **Backend (dev only):** Flask + env-loaded config + connection pooling
- **Deploy:** Vercel (frontend), demo-mode static snapshot

The full architectural plan, atomic-task ledger, and locked decisions live in [`REFACTOR_PLAN.md`](REFACTOR_PLAN.md).

## Local development

```bash
# Frontend (dev mode hits the real backend)
cd frontend
npm ci
npm run dev          # → http://localhost:3000

# Frontend (demo mode — no backend needed)
VITE_DEMO_MODE=true npm run dev

# Backend (dev only — Flask)
cd backend
pip install -r requirements.txt
python mock_server.py   # → http://localhost:5000
```

Regenerate the static demo snapshot:

```bash
python backend/scripts/generate_mock.py
# writes frontend/public/sample-chargers.json (400 features, seed 42)
```

## Pre-refactor state

The pre-refactor source is preserved on the `legacy` branch and the signed `v0-legacy` tag.

```
git fetch origin
git checkout legacy
```

## License

MIT — see [`LICENSE`](LICENSE).
