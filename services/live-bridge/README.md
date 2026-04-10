# @derby/live-bridge

A Node.js/TypeScript service that polls the [derby-scoreboard-api](../scoreboard-api/README.md)
`/live` endpoint and writes per-jam snapshots to Supabase in real time.

---

## What it does

The live-bridge sits between the scoreboard API and your Supabase database. Every
`POLL_INTERVAL_MS` milliseconds it fetches the current game state. When it detects
that the jam number has changed it treats the **previous** jam as complete and
persists its final state as a row in `live_jam_snapshots`.

Key behaviours:

- **Jam transition detection** — a snapshot is written when `(period, jam)` changes,
  not on every poll. This keeps the write volume low and the data meaningful.
- **Disconnect resilience** — if the scoreboard API goes offline the bridge keeps
  polling and logs a warning. A debounce timer (`JAM_END_DEBOUNCE_MS`) fires a
  "best-effort" snapshot write in case the connection never recovers mid-jam.
- **Reconnect detection** — when the scoreboard comes back online the bridge logs
  the reconnect and resumes capturing snapshots transparently.
- **Graceful shutdown** — on `SIGINT` / `SIGTERM` the bridge flushes the current
  jam snapshot and marks the `live_games` row as `completed` before exiting.
- **Restart safety** — on startup the bridge queries for an existing `active`
  `live_games` row with the same `scoreboard_source`. If one is found it resumes
  from there instead of creating a duplicate row.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        derby-stat-tracker monorepo                  │
│                                                                     │
│  ┌──────────────────┐   HTTP GET /live    ┌─────────────────────┐  │
│  │  scoreboard-api  │ ◄────────────────── │    live-bridge      │  │
│  │  (Python/asyncio)│ ──────────────────► │  (Node.js/TS)       │  │
│  │                  │   JSON LiveState    │                     │  │
│  │  CRG WebSocket   │                     │  JamPoller          │  │
│  │  re-exposes as   │                     │   └─ ScoreboardClient│  │
│  │  HTTP            │                     │   └─ SupabaseWriter │  │
│  └──────────────────┘                     └──────────┬──────────┘  │
│                                                      │             │
│                                                      │ upsert      │
│                                                      ▼             │
│                                            ┌─────────────────────┐ │
│                                            │      Supabase        │ │
│                                            │                      │ │
│                                            │  live_games          │ │
│                                            │  live_jam_snapshots  │ │
│                                            └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

  CRG scoreboard ──► scoreboard-api ──► live-bridge ──► Supabase DB
```

### Data flow

```
Poll tick (every POLL_INTERVAL_MS)
        │
        ▼
  GET /live
        │
        ├─ connected: false ──► log warning, arm debounce timer, continue
        │
        └─ connected: true
                │
                ▼
        Has JamKey changed?  (JamKey = "P{period}J{jam}")
                │
                ├─ No  ──► update lastLiveState, continue
                │
                └─ Yes ──► write snapshot for PREVIOUS jam
                           update lastJamKey
                           update lastLiveState
                           continue

SIGINT / SIGTERM
        │
        ▼
  flush current jam snapshot
  mark live_games.status = 'completed'
  exit 0
```

---

## Database schema

The service writes to two tables (defined in `database/`):

```sql
CREATE TABLE live_games (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bout_id          UUID REFERENCES bouts(id),
  scoreboard_source TEXT NOT NULL,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  status           TEXT DEFAULT 'active'   -- 'active' | 'completed'
);

CREATE TABLE live_jam_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_game_id     UUID REFERENCES live_games(id),
  period           INTEGER NOT NULL,
  jam              INTEGER NOT NULL,
  team1_score      INTEGER,
  team2_score      INTEGER,
  team1_jam_score  INTEGER,
  team2_jam_score  INTEGER,
  team1_jammer     TEXT,
  team2_jammer     TEXT,
  team1_lead       BOOLEAN,
  team2_lead       BOOLEAN,
  raw_state        JSONB,
  captured_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_game_id, period, jam)
);
```

The `UNIQUE(live_game_id, period, jam)` constraint means the bridge can safely
upsert — re-processing the same jam (e.g. after a restart) overwrites rather
than duplicates the row.

---

## Setup

### 1. Clone the monorepo (if you haven't already)

```sh
git clone https://github.com/your-org/derby-stat-tracker.git
cd derby-stat-tracker
```

### 2. Install dependencies

From the **monorepo root**:

```sh
npm install
```

This installs the workspace packages including `@derby/live-bridge`.

Or, to install only within this service:

```sh
cd services/live-bridge
npm install
```

### 3. Copy `.env.example` and fill in your values

```sh
cd services/live-bridge
cp .env.example .env
```

Then edit `.env`:

```
SCOREBOARD_API_URL=http://localhost:5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
POLL_INTERVAL_MS=1000
JAM_END_DEBOUNCE_MS=2000
LOG_LEVEL=info
```

> **Important — use the service role key, not the anon key.**
> See the [security note](#security-service-role-key) below.

### 4. Apply database migrations

Ensure the `live_games` and `live_jam_snapshots` tables exist in your Supabase
project. SQL migration files live in `database/migrations/` in the monorepo root.

---

## Running

### Development mode (with hot reload)

```sh
# From the monorepo root:
npm run bridge:dev

# Or directly from this directory:
npm run dev
```

Uses `tsx watch` — the process restarts automatically when source files change.

### Production build

```sh
# Build TypeScript → dist/
npm run build

# Run the compiled output
npm run start
```

### From the monorepo root (production)

```sh
npm run bridge:build
npm run bridge:start
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SCOREBOARD_API_URL` | ✅ | — | Base URL of the scoreboard-api service, e.g. `http://localhost:5001`. Trailing slash is stripped automatically. |
| `SUPABASE_URL` | ✅ | — | Your Supabase project URL, e.g. `https://abc123.supabase.co`. |
| `SUPABASE_SERVICE_KEY` | ✅ | — | Supabase **service role** key. **Never** use the anon key here. |
| `POLL_INTERVAL_MS` | ❌ | `1000` | How often to poll `/live` in milliseconds. Minimum `200`. |
| `JAM_END_DEBOUNCE_MS` | ❌ | `2000` | How long to wait after a disconnect before writing a "final" snapshot for the current jam. |
| `LOG_LEVEL` | ❌ | `info` | Logging verbosity: `debug` \| `info` \| `warn` \| `error`. |
| `BOUT_ID` | ❌ | — | UUID of an existing `bouts` row to link this live session to. Leave blank to run unlinked. |

---

## Security — service role key

The bridge writes directly to Supabase tables that are protected by Row Level
Security (RLS). The Supabase **anon key** is subject to RLS policies and will be
blocked from inserting into `live_games` and `live_jam_snapshots` unless you
explicitly allow it.

The **service role key** bypasses RLS entirely, which is exactly what a
trusted server-side process like this bridge needs.

**Rules of thumb:**

- ✅ Use the service role key in `.env` on your server / CI / container.
- ❌ Never commit `.env` to version control (it is listed in `.gitignore`).
- ❌ Never expose the service role key to the browser or a public API.
- ❌ Never use the service role key in `apps/web` — use the anon key there.

You can find both keys in the Supabase dashboard under
**Project Settings → API → Project API keys**.

---

## How it connects to the scoreboard API

The bridge calls two endpoints on the scoreboard-api service:

| Endpoint | Usage |
|---|---|
| `GET /health` | Called once at startup to confirm the API is reachable before entering the poll loop. |
| `GET /live` | Polled every `POLL_INTERVAL_MS` ms. Returns the full live game state as JSON. |

The scoreboard-api returns **HTTP 503** with `"connected": false` when it is not
yet connected to the CRG WebSocket. The bridge handles this gracefully — it logs
a warning and continues polling rather than crashing.

For the full response shape and scoreboard-api setup instructions see
[`services/scoreboard-api/README.md`](../scoreboard-api/README.md).

---

## Development

### Running tests

```sh
npm test
```

Uses [Vitest](https://vitest.dev/). Test files live alongside source files with
the `.test.ts` suffix and are excluded from the production build.

### Linting

```sh
npm run lint
```

### Project structure

```
services/live-bridge/
├── src/
│   ├── index.ts            # Main entry point — wires everything together
│   ├── config.ts           # Env var loading and validation
│   ├── logger.ts           # Structured logger (respects LOG_LEVEL)
│   ├── types.ts            # TypeScript interfaces and utility types
│   ├── scoreboard-client.ts# HTTP client for the scoreboard API
│   ├── supabase-writer.ts  # Supabase insert / upsert / update helpers
│   └── poller.ts           # JamPoller — the main orchestration loop
├── dist/                   # Compiled output (git-ignored)
├── .env                    # Local config (git-ignored)
├── .env.example            # Template — commit this, not .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

**"Missing required environment variable"**
→ Check that you have copied `.env.example` to `.env` and filled in all three
required variables (`SCOREBOARD_API_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`).

**"Scoreboard API is up and connected to CRG" never appears**
→ Make sure the `scoreboard-api` Python service is running on the URL you set
in `SCOREBOARD_API_URL`, and that the CRG scoreboard software is running and
accessible to it.

**Snapshots are not appearing in Supabase**
→ Double-check you are using the **service role key**, not the anon key.
Check the `live_games` table — a row with `status = 'active'` should appear as
soon as the bridge starts. If not, the Supabase URL or key is likely wrong.

**High snapshot volume / performance**
→ Increase `POLL_INTERVAL_MS`. A value of `2000`–`5000` is fine for post-game
analysis. Keep it at `1000` if you want near-real-time updates.