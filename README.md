# Derby Stat Tracker — Monorepo

A roller derby statistics platform with two modes: **manual stat tracking** during a bout, and **live scoreboard integration** via the CRG ScoreBoard software.

---

## Repository Structure

```
derby-stat-tracker/
├── apps/
│   └── web/                      # React + Vite web application (deployed to Vercel)
├── packages/
│   └── live-frontend/            # Live overlay UI components (from spark repo — see note below)
├── services/
│   ├── scoreboard-api/           # Python asyncio CRG WebSocket proxy (HTTP API)
│   └── live-bridge/              # Node.js service: polls scoreboard API → writes to Supabase
├── database/
│   ├── schema.sql                # Full initial database schema
│   ├── migrations/               # Incremental SQL migrations
│   └── supabase-rls-performance-fixes.sql
├── e2e/                          # Playwright end-to-end tests
├── .github/
│   └── workflows/                # CI/CD pipelines
└── package.json                  # npm workspaces root
```

---

## Apps & Services

| Package | Path | Description | Runtime |
|---|---|---|---|
| `@derby/web` | `apps/web` | React + Vite web app | Vercel |
| `@derby/live-frontend` | `packages/live-frontend` | Live overlay UI components | (bundled into web) |
| `scoreboard-api` | `services/scoreboard-api` | CRG WebSocket → HTTP proxy | Python 3.11+ |
| `@derby/live-bridge` | `services/live-bridge` | Polls `/live` → Supabase | Node.js 20+ |
| `@derby/e2e` | `e2e` | Playwright E2E test suite | CI / local |

---

## Architecture Overview

```
  CRG ScoreBoard (local)
         │  WebSocket
         ▼
  ┌──────────────────┐
  │  scoreboard-api  │  Python asyncio   port 5001
  │  GET /live       │◄──────────────────────────────────────┐
  │  GET /health     │                                        │
  └────────┬─────────┘                                        │
           │ HTTP poll                    HTTP poll           │
           ▼                                  │               │
  ┌──────────────────┐              ┌─────────┴──────────┐   │
  │   live-bridge    │              │     apps/web        │   │
  │  Node.js service │              │  React (Vercel)     │   │
  │  writes snapshots│              │  Manual tracking    │   │
  └────────┬─────────┘              │  Live scoreboard UI │   │
           │ @supabase/supabase-js  └────────────┬────────┘   │
           ▼                                     │             │
  ┌──────────────────────────────────────────────▼─────────┐  │
  │                        Supabase                         │  │
  │  teams · players · bouts · player_stats                 │  │
  │  live_games · live_jam_snapshots                        │  │
  └─────────────────────────────────────────────────────────┘  │
                                                               │
  VITE_SCOREBOARD_API_URL ──────────────────────────────────────┘
```

**Two modes after login:**
- **📊 Manual Stat Tracking** — track jams, lineups, and scores by hand during a bout; all data saved directly to Supabase from the browser.
- **📡 Live from Scoreboard** — read live data from CRG via the scoreboard API; the `live-bridge` service captures jam snapshots automatically.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Python | ≥ 3.11 (for `scoreboard-api`) |
| Git | any recent version |

---

## Quick Start

### 1. Clone the repo

```sh
git clone https://github.com/a1ly404/derby-stat-tracker.git
cd derby-stat-tracker
```

### 2. Install all Node dependencies (workspaces)

```sh
npm install
```

This installs dependencies for `apps/web`, `packages/live-frontend`, `services/live-bridge`, and `e2e` in one command.

### 3. Set up environment variables

**Web app** (`apps/web/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SCOREBOARD_API_URL=http://localhost:5001
```

**Live bridge** (`services/live-bridge/.env`):
```env
SCOREBOARD_API_URL=http://localhost:5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
POLL_INTERVAL_MS=1000
```

> ⚠️ Use the **service role key** (not the anon key) for `live-bridge` — it needs to bypass RLS to write snapshots.
> Never commit `.env` files. `.env.example` files are provided in each package.

### 4. Apply the database schema

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL editor
3. Run `database/schema.sql` (initial tables)
4. Run `database/migrations/001_live_tables.sql` (live tracking tables)

See [`database/README.md`](database/README.md) and [`database/migrations/README.md`](database/migrations/README.md) for details.

### 5. Set up the scoreboard API (Python)

```sh
cd services/scoreboard-api
git clone https://github.com/a1ly404/derby-scoreboard-api .   # first time only
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The service listens on `http://localhost:5001` by default.

---

## Running the App

From the **monorepo root**:

```sh
# Start the React web app (http://localhost:5173)
npm run dev

# Start the live bridge service
npm run bridge:dev

# Run web app unit tests
npm run test

# Run unit tests across all workspaces
npm run test:all

# Run Playwright E2E tests (starts dev server automatically)
npm run e2e

# Lint all workspaces
npm run lint
```

From individual workspaces:

```sh
# Web app
cd apps/web && npm run dev

# Live bridge
cd services/live-bridge && npm run dev

# E2E tests
cd e2e && npm run test:ui
```

---

## Deployment

### Web App — Vercel

The `apps/web` app is deployed to Vercel.

**Vercel project settings** (configure in the Vercel dashboard):
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

Required environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SCOREBOARD_API_URL` (set to your publicly accessible scoreboard API URL, or leave empty to prompt users to configure it in the UI)

### Live Bridge — Local / Docker

The `live-bridge` service is designed to run **on the same machine as the CRG scoreboard** (or on your local network alongside it):

```sh
cd services/live-bridge
cp .env.example .env   # fill in values
npm run build
npm run start
```

---

## Importing the Spark Frontend (`packages/live-frontend`)

The `packages/live-frontend` package is a placeholder for the live overlay UI created with GitHub Spark. Once you have access to the spark repo source:

1. Copy the source files into `packages/live-frontend/`
2. Ensure the package exports React components from its `index.ts`
3. Add `"@derby/live-frontend": "*"` to `apps/web/package.json` dependencies
4. Run `npm install` from the root to link the workspace package
5. Import components in `apps/web/src/components/LiveScoreboardView.tsx`

---

## Testing

| Test suite | Command | Location |
|---|---|---|
| Unit + component (Vitest) | `npm run test` | `apps/web/src/**/*.test.*` |
| Coverage report | `npm run test:coverage` | `apps/web/coverage/` |
| Scoreboard API (pytest) | `pytest` in `services/scoreboard-api` | `services/scoreboard-api/tests/` |
| E2E (Playwright) | `npm run e2e` | `e2e/tests/` |

---

## CI/CD

GitHub Actions workflows (`.github/workflows/`):

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | push/PR to `main`, `dev` | Lint → test → build web app; deploy to Vercel on `main` |
| `quality-gate.yml` | push/PR | Code quality checks |
| `lighthouse.yml` | push to `main` | Lighthouse performance audit |
| `codeql.yml` | scheduled + push | CodeQL security analysis |
| `test-before-deploy.yml` | push to `main` | Gate: tests must pass before any deploy |

---

## Database Schema

See [`database/README.md`](database/README.md) for the full schema reference.

**Core tables:** `teams`, `players`, `player_teams`, `bouts`, `player_stats`

**Live tracking tables** (added by `migrations/001_live_tables.sql`):
- `live_games` — one row per scoreboard session
- `live_jam_snapshots` — one row per jam boundary, written by `live-bridge`

---

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Ensure `npm run lint` and `npm run test` pass
4. Open a PR targeting `dev`

---

## Licence

Private repository — all rights reserved.