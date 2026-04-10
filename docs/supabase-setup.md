# Supabase Database Setup Guide

> **Project:** Derby Stat Tracker
> **Supabase Project Ref:** `flrurnbminmlmlekappp`
> **Dashboard:** https://supabase.com/dashboard/project/flrurnbminmlmlekappp

---

## Connection Details

| Property | Value |
|---|---|
| **Supabase URL** | `https://flrurnbminmlmlekappp.supabase.co` |
| **Direct Host** | `db.flrurnbminmlmlekappp.supabase.co` (IPv6 only) |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | Stored in `.env` as `DATABASE_PASSWORD` |

### Direct Connection String (IPv6 required)

```
postgresql://postgres:[PASSWORD]@db.flrurnbminmlmlekappp.supabase.co:5432/postgres
```

### Session Pooler (IPv4 compatible)

The direct connection is **IPv6 only**. If your machine doesn't have IPv6 connectivity, use the Session Pooler from the Supabase dashboard:

1. Go to **Settings → Database → Connection string**
2. Click **"Pooler settings"** or select **"Session pooler"** mode
3. Copy the connection string — it will look like:

```
postgresql://postgres.flrurnbminmlmlekappp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

> **Note:** Transaction pooler (port `6543`) works for queries but may have issues with DDL-heavy scripts. Prefer session pooler (port `5432`) for running `setup.sql`.

---

## Step 1: Run the Schema Setup

The consolidated `setup.sql` creates everything in one pass:
- Core tables (teams, players, player_teams, bouts, player_stats)
- RLS policies with optimised `(SELECT auth.uid())` pattern
- Performance indexes
- Live tracking tables (live_games, live_jam_snapshots)
- Live digest tables & functions (live_jam_lineups, live_timeout_events, live_skater_game_stats, live_game_digests)
- Production seed data (teams, players, rosters)

### Option A: Supabase SQL Editor (recommended if no psql access)

1. Open https://supabase.com/dashboard/project/flrurnbminmlmlekappp/sql/new
2. Copy the contents of `database/setup.sql`
3. Paste into the SQL editor and click **Run**

### Option B: psql (requires IPv6 or session pooler)

```sh
PGPASSWORD='<password>' psql "postgresql://postgres@db.flrurnbminmlmlekappp.supabase.co:5432/postgres" \
  -f database/setup.sql
```

Or via session pooler:

```sh
PGPASSWORD='<password>' psql "postgresql://postgres.flrurnbminmlmlekappp@aws-0-<REGION>.pooler.supabase.com:5432/postgres" \
  -f database/setup.sql
```

---

## Step 2: Restore Production Data (optional)

This inserts real teams, players, rosters, bouts, and stats from the Oct 2025 backup. It's idempotent (`ON CONFLICT DO NOTHING`).

### Option A: SQL Editor

1. Open https://supabase.com/dashboard/project/flrurnbminmlmlekappp/sql/new
2. Copy the contents of `database/restore-data.sql`
3. Paste and click **Run**

### Option B: psql

```sh
PGPASSWORD='<password>' psql "<connection-string>" -f database/restore-data.sql
```

---

## Step 3: Verify

Run this query to confirm tables are populated:

```sql
SELECT 'teams' AS tbl, count(*) FROM teams
UNION ALL SELECT 'players', count(*) FROM players
UNION ALL SELECT 'player_teams', count(*) FROM player_teams
UNION ALL SELECT 'bouts', count(*) FROM bouts
UNION ALL SELECT 'player_stats', count(*) FROM player_stats
UNION ALL SELECT 'live_games', count(*) FROM live_games
UNION ALL SELECT 'live_jam_snapshots', count(*) FROM live_jam_snapshots;
```

---

## API Keys

All keys are stored in the root `.env` file (gitignored). The key env vars used by each component:

| Component | Env Var | Key Type |
|---|---|---|
| `apps/web` | `VITE_SUPABASE_URL` | Supabase URL |
| `apps/web` | `VITE_SUPABASE_ANON_KEY` | `anon` JWT |
| `services/live-bridge` | `SUPABASE_URL` | Supabase URL |
| `services/live-bridge` | `SUPABASE_SERVICE_KEY` | `service_role` JWT |

Find these in the Supabase dashboard under **Settings → API → Project API keys**.

---

## Database Files Reference

| File | Purpose |
|---|---|
| `database/setup.sql` | **Primary entry point** — consolidated idempotent schema (run this on a fresh project) |
| `database/restore-data.sql` | Production data restore (teams, players, bouts, stats from Oct 2025 backup) |
| `database/schema.sql` | Legacy core schema (reference only — use `setup.sql` instead) |
| `database/supabase-rls-performance-fixes.sql` | Legacy RLS fix (folded into `setup.sql`) |
| `database/migrations/001_live_tables.sql` | Live tracking tables migration |
| `database/migrations/002_live_digest_tables.sql` | Digest tables & functions migration |

---

## Post-Setup: Digesting Live Games

After a live game is recorded (via the live-bridge service), you can extract structured data from raw JSON snapshots:

```sql
-- Normalize a completed game's snapshots into lineup, stats, and digest tables
SELECT digest_live_game('<live_game_id>');

-- Match skater names/numbers to existing players in the players table
SELECT reconcile_live_players('<live_game_id>');
```

The live-bridge service now calls these automatically on shutdown/game completion.

---

## Troubleshooting

### "Tenant or user not found" on pooler connection
The project may still be provisioning. Wait 5–15 minutes and retry. Check the dashboard to confirm the project status is "Active".

### "could not translate host name" on direct connection
The direct host (`db.flrurnbminmlmlekappp.supabase.co`) is IPv6 only. Use the session pooler instead, or run SQL through the Supabase SQL Editor in the browser.

### IPv6 connectivity check

```sh
# Check if your machine can reach the database over IPv6
ping6 -c 2 db.flrurnbminmlmlekappp.supabase.co
```

If this fails with "No route to host", you must use the session pooler or the SQL Editor.