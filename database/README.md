# Database Scripts

This folder contains SQL scripts, migration files, and backup data for the Derby Stat Tracker Supabase database.

## Directory Structure

```
database/
├── setup.sql                               # Consolidated schema — run this on a fresh project
├── restore-data.sql                        # Restores production data from the Oct 2025 backup
├── schema.sql                              # Original core schema (for reference)
├── supabase-rls-performance-fixes.sql      # RLS + index optimisations (folded into setup.sql)
├── db_cluster-13-10-2025@09-04-31.backup.gz  # Full Supabase pg_dump backup
├── npbrybiuaeqzdslposts.storage.zip        # Storage bucket export (empty)
└── migrations/
    ├── README.md                           # Migration run-order and details
    ├── 001_live_tables.sql                 # Adds live_games + live_jam_snapshots
    └── 002_live_digest_tables.sql          # Adds digest tables + functions for API data
```

## Quick Start — New Supabase Project

### 1. Create the project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Note your:
- **Project URL** (`https://xxxxxxxx.supabase.co`)
- **Anon key** (public)
- **Service role key** (private — used by the live-bridge service)

### 2. Run the consolidated setup

Open **SQL Editor** in the Supabase Dashboard and run:

```sql
-- Paste the entire contents of setup.sql and execute
```

This single script creates everything:

| Section | What it creates |
|---------|----------------|
| Core tables | `teams`, `players`, `player_teams`, `bouts`, `player_stats` |
| RLS policies | Optimised `(SELECT auth.uid()) IS NOT NULL` pattern on all tables |
| Performance indexes | FK indexes, composite indexes for common query patterns |
| Live tables | `live_games`, `live_jam_snapshots` for real-time scoreboard capture |
| Digest tables | `live_jam_lineups`, `live_timeout_events`, `live_skater_game_stats`, `live_game_digests` |
| Digest functions | `digest_live_game()`, `reconcile_live_players()` |
| Sample seed data | A few teams, players, and roster assignments |

### 3. Restore production data (optional)

If you want to restore the actual data from the original Supabase instance:

```sql
-- Paste the entire contents of restore-data.sql and execute
```

This restores 4 teams, 4 players, 5 roster assignments, 2 bouts, and 7 stat records from the October 2025 backup. All INSERTs use `ON CONFLICT DO NOTHING` so it's safe to run alongside the sample seed data.

### 4. Create your auth user

In the Supabase Dashboard go to **Authentication → Users → Add User** and create your login credentials. The app uses email/password auth.

### 5. Wire up the apps

Update the environment variables in each app:

**apps/web** (`.env` or Vercel env vars):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**services/live-bridge** (`.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SCOREBOARD_API_URL=http://localhost:5001
```

## Files

### `setup.sql`

The **recommended** way to initialise a new project. A single-pass, idempotent script that consolidates the core schema, all migrations through 002, RLS policies, indexes, and seed data. Run this once on a fresh Supabase project and you're ready to go.

### `restore-data.sql`

Restores the actual production data extracted from `db_cluster-13-10-2025@09-04-31.backup.gz`. Contains the real team names, player derby names, roster assignments, bout records, and player stats with their original UUIDs. Run this after `setup.sql`.

### `schema.sql`

The original core schema script (kept for reference). Creates the 5 core tables, their triggers, RLS policies, and sample seed data. If you're starting from scratch, prefer `setup.sql` instead — it includes everything in this file plus all migrations.

### `supabase-rls-performance-fixes.sql`

One-time RLS and index performance patches. Replaces the original `auth.role() = 'authenticated'` policies with the faster `(SELECT auth.uid()) IS NOT NULL` subquery pattern and adds missing foreign-key indexes. Already folded into `setup.sql`.

### `db_cluster-13-10-2025@09-04-31.backup.gz`

Full `pg_dump` cluster backup from the original Supabase instance (October 2025). Contains all Supabase internal tables (auth, realtime, storage) plus the public schema data. The relevant public-schema data has been extracted into `restore-data.sql` for easy use.

### `npbrybiuaeqzdslposts.storage.zip`

Storage bucket export from the original instance. Currently empty (no uploaded files existed).

## Schema Overview

### Manual Stat Tracking (core tables)

These tables power the manual stat tracking mode in `apps/web`:

```
teams ──────────── player_teams ──────────── players
  │                     │                       │
  │ (home/away)         │ (number, position)    │
  ▼                     ▼                       ▼
bouts ─────────────────────────────────── player_stats
  (date, venue,                            (jams, points,
   scores, status)                          penalties, etc.)
```

### Live Scoreboard Capture (migration 001)

These tables store raw data from the CRG scoreboard via the live-bridge service:

```
live_games ──────────── live_jam_snapshots
  (session, status,        (period, jam, scores,
   scoreboard_source)       jammer, lead, raw_state JSONB)
```

### Live Data Digest (migration 002)

These tables normalise the raw JSONB data into queryable structures:

```
live_jam_snapshots
      │ (digest_live_game)
      ▼
live_jam_lineups            Per-position per-team per-jam lineup records
live_timeout_events         Timeout/official review events
live_skater_game_stats      Aggregated per-skater stats for a game
live_game_digests           Single-row summary for a completed game
```

**Key functions:**

| Function | Purpose |
|----------|---------|
| `digest_live_game(game_id)` | Extracts `raw_state` JSONB into all digest tables. Idempotent — safe to re-run. |
| `reconcile_live_players(game_id)` | Links skaters from live data to existing `players` table entries by derby name or number. |

## Data Flow

```
CRG ScoreBoard (WebSocket on :8000)
       │
       ▼
scoreboard-api (Python, HTTP on :5001)
  GET /live  →  { period, jam, team1: { score, jammer, ... }, team2: { ... } }
       │
       ▼
live-bridge (Node.js poller)
  Detects jam transitions → upserts into live_jam_snapshots
  Manages live_games lifecycle (active → completed)
       │
       ▼
Supabase (PostgreSQL)
  live_jam_snapshots stores raw_state JSONB
       │
       ▼ (SELECT digest_live_game(game_id))
  Normalised tables: lineups, timeouts, skater stats, game digest
       │
       ▼
apps/web + apps/live-tracker (React frontends)
  Read from Supabase for display and analysis
```

## Migrations

Migrations must be applied in ascending numerical order after `schema.sql`. See [`migrations/README.md`](./migrations/README.md) for details.

| Order | File | Description |
|-------|------|-------------|
| 0 | `schema.sql` | Core tables: teams, players, player_teams, bouts, player_stats |
| 1 | `001_live_tables.sql` | Live tracking: live_games, live_jam_snapshots |
| 2 | `002_live_digest_tables.sql` | Digest tables + functions for processing API data |

> **Tip:** If starting fresh, just run `setup.sql` — it includes everything.

## Adding Future Migrations

1. Create a new file in `migrations/` with the next number (e.g. `003_my_change.sql`)
2. Write the script to be **idempotent** — use `IF NOT EXISTS`, `DROP … IF EXISTS`, `CREATE OR REPLACE`
3. Update the table in [`migrations/README.md`](./migrations/README.md)
4. Add the new tables/functions to the end of `setup.sql` in a new section
5. Test in a staging project before applying to production
6. Apply migrations in strict numerical order — never skip or reorder