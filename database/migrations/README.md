# Database Migrations

This directory contains versioned SQL migration scripts for the Derby Stat Tracker Supabase database.

Migrations are numbered sequentially and must be applied in order. Each script is **idempotent** — it uses `IF NOT EXISTS`, `DROP … IF EXISTS`, and `CREATE OR REPLACE` guards so it can be re-run safely without causing errors or data loss.

---

## How to Apply Migrations

### Option 1 — Supabase SQL Editor (simplest)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open the migration file you want to apply in your text editor.
4. Copy the entire file contents and paste them into the SQL Editor.
5. Click **Run** (or press `Cmd/Ctrl + Enter`).
6. Confirm the output shows no errors before moving on to the next file.

### Option 2 — Supabase CLI

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and your project linked (`supabase link`):

```bash
# Push all pending migrations
supabase db push

# Or apply a single file manually via psql
psql "$DATABASE_URL" -f migrations/001_live_tables.sql
```

> **Tip:** Get your `DATABASE_URL` from **Project Settings → Database → Connection string (URI)** in the Supabase Dashboard.

### Option 3 — Use `setup.sql` (fresh projects only)

If you're starting from scratch, skip the individual migrations and run `../setup.sql` instead — it consolidates the core schema plus all migrations into a single pass.

---

## Run Order

Migrations **must** be applied in ascending numerical order. The initial schema (`../schema.sql`) must already be present before running any numbered migration.

| Order | File | Status | Description |
|-------|------|--------|-------------|
| 0 | `../schema.sql` | Initial schema | `teams`, `players`, `player_teams`, `bouts`, `player_stats` |
| 1 | `001_live_tables.sql` | ✅ Applied | Live tracking tables |
| 2 | `002_live_digest_tables.sql` | ✅ Applied | Digest tables and functions for API data processing |

---

## Migration Files

### `001_live_tables.sql`

**Purpose:** Adds the two tables required by the live-bridge service for real-time scoreboard tracking.

**New tables:**

- **`live_games`** — One row per live game session captured from a CRG scoreboard. Optionally linked to an existing `bouts` row via `bout_id`. Tracks `status` (`active` / `completed` / `abandoned`), the scoreboard source URL, and start/end timestamps.

- **`live_jam_snapshots`** — One row per jam boundary, upserted by the live-bridge service on each jam transition. Stores per-jam scores, jammer identities, lead-jammer flags, and the full raw scoreboard state as `JSONB`. The `(live_game_id, period, jam)` triple is unique, making upserts safe.

**Also includes:**
- `updated_at` auto-update trigger on `live_games`
- Indexes on `live_jam_snapshots(live_game_id)` and `live_jam_snapshots(live_game_id, period, jam)`
- Row Level Security enabled on both tables
- RLS policies for `authenticated` users (optimised `(SELECT auth.uid())` pattern)
- `service_role` bypass policies for the live-bridge service

---

### `002_live_digest_tables.sql`

**Purpose:** Adds tables and functions for processing the rich data captured in `live_jam_snapshots.raw_state` into normalised, queryable structures.

**New tables:**

- **`live_jam_lineups`** — One row per skater position per team per jam. Each jam produces up to 10 rows (5 positions × 2 teams). Extracts skater name, number, penalty-box status, lead/star-pass flags, and per-jam score from the JSONB payload. Includes an optional `player_id` FK for linking to the `players` table.

- **`live_timeout_events`** — One row per timeout or official review during a live game. Records timeout type, owner, and remaining timeout/review counts for both teams.

- **`live_skater_game_stats`** — Aggregated per-skater stats for a single game. Includes jam counts by position, lead-jammer stats, points scored, and penalty-box trips. One row per unique skater identity per game.

- **`live_game_digests`** — Single-row summary for a completed game. Contains final scores, total jams, lead-jam counts, star-pass counts, timeout usage, penalty totals, score extremes (max lead, closest margin), and timing data.

**New functions:**

- **`digest_live_game(game_id UUID)`** — Extracts `raw_state` JSONB from all `live_jam_snapshots` for the given game into the four digest tables. Safe to call multiple times (deletes and re-inserts). Also attempts automatic player reconciliation by matching skater names to the `players` table.

- **`reconcile_live_players(game_id UUID)`** — Re-runs player matching for a specific game. Matches by exact derby name (case-insensitive) and by preferred number as a fallback. Returns the number of rows matched. Useful after importing new players or correcting scoreboard names.

**Also includes:**
- `updated_at` triggers on `live_skater_game_stats` and `live_game_digests`
- Indexes for all four tables (game lookups, skater lookups, player FK)
- Row Level Security with `authenticated` user + `service_role` bypass policies

**Usage:**

```sql
-- Digest a completed game
SELECT digest_live_game('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- Re-run player matching after adding new players
SELECT reconcile_live_players('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- View the game summary
SELECT * FROM live_game_digests WHERE live_game_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- View per-skater stats
SELECT * FROM live_skater_game_stats WHERE live_game_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' ORDER BY total_points DESC;

-- View lineups for a specific jam
SELECT * FROM live_jam_lineups WHERE live_game_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' AND period = 1 AND jam = 5;
```
