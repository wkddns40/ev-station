# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `.gitignore` covering Node/Python/OS/IDE/env/logs artifacts (T0.3, D6)
- `.env.example` documenting frontend `REACT_APP_*` and backend `DB_*` / `FLASK_*` keys (T0.4, D6)
- `LICENSE` (MIT, `Copyright (c) 2026 wkddns40`) (T0.8, D8)
- `api/requirements.txt` with pinned backend deps (T0.7c)
- `.github/pull_request_template.md` (T0.1h2–h3, D10)
- English `README.md` stub linking to `REFACTOR_PLAN.md`; original Korean README preserved as `README.ko.md` (T0.9, D7)

### Changed
- Frontend secrets externalized to `process.env.REACT_APP_*`: Mapbox token, data URL, icon atlas path, API base URL (T0.5, D6)
- Backend DB credentials read from `os.environ['DB_*']` via `python-dotenv` (T0.6, D6)
- Flask `debug` gated behind `FLASK_ENV == 'development'`; default host bound to `127.0.0.1` (was `0.0.0.0`); port read from `FLASK_PORT` (T0.7a–b)
- Repo-scoped Git identity set to `wkddns40 <wkddns40@gmail.com>` (T0.1f2, D9)
- Repo-scoped SSH commit + tag signing enabled with ed25519 key (T0.1f3–f6, D11)

### Security
- Removed hardcoded Mapbox access token, `iptime.org:5000` API host, `127.0.0.1:5500` icon path, and `mapbox://styles/djangbogo/...` style URL from source (T0.5, D6)
- Removed hardcoded MySQL host/user/password/database from `api/charger_api.py` (T0.6, D6)
- `gitleaks v8.30.1` full-history scan: 77 commits, no leaks found (T0.2)
- `legacy` branch + signed `v0-legacy` tag preserve pre-refactor baseline before public exposure (T0.1g)
