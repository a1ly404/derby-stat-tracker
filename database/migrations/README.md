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

---

## Run Order

Migrations **must** be applied in ascending numerical order. The initial schema (`../schema.sql`) must already be present before running any numbered migration.

| Order | File | Status |
|-------|------|--------|
| 0 | `../schema.sql` | Initial schema — `teams`, `players`, `player_teams`, `bouts`, `player_stats` |
| 1 | `001_live_tables.sql` | Adds live-tracking tables (see below) |

---

## Migration Files

### `001_live_tables.sql`

**Purpose:** Adds the two tables required by the live-bridge service for real-time scoreboard tracking.

**New tables:**

- **`live_games`** — One row per live game session captured from a CRG scoreboard. Optionally linked to an existing `bouts` row via `bout_id`. Tracks `status` (`active` / `completed` / `abandoned`), the scoreboard source URL, and start/end timestamps.

- **`live_jam_snapshots`** — One row per jam boundary, upserted by the live-bridge service on each jam transition. Stores per-jam scores, jammer identities, lead-jammer flags, and the full raw scoreboard state as `JSONB`. The `(live_game_id, period, jam)` triple is unique, making upserts safe.

**Also includes:**
- `updated_at` auto-update trigger on `live_games` (reuses the existing `update_updated_at_column()` function).
- Indexes on `live_jam_snapshots(live_game_id)` and `live_jam_snapshots(live_game_id, period, jam)`.
- Row Level Security enabled on both tables.
- RLS policies granting `authenticated` users full SELECT / INSERT / UPDATE / DELETE access (same pattern as existing tables, with the `(SELECT auth.uid())` subquery optimisation to avoid per-row re-evaluation).
- A `service_role` bypass policy on both tables so the live-bridge service can write data using its service key without RLS blocking it.