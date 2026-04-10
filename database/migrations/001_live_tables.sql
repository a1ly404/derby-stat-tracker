-- =============================================================================
-- Migration 001: Live Tracking Tables
-- =============================================================================
-- Adds two new tables to support real-time scoreboard integration:
--   • live_games          — one row per scoreboard session, optionally linked to a bout
--   • live_jam_snapshots  — one row per jam boundary, upserted by the live-bridge service
--
-- Prerequisites: schema.sql must already be applied (provides the bouts table and
--   the update_updated_at_column() trigger function).
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TABLE: live_games
-- ---------------------------------------------------------------------------
-- Represents a single live-tracking session captured from the scoreboard API.
-- May be linked to an existing bout record, or stand alone (bout_id = NULL).

CREATE TABLE IF NOT EXISTS public.live_games (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional link to a manually-created bout record.
  -- SET NULL on delete so a live session survives if the bout is removed.
  bout_id            UUID        REFERENCES public.bouts(id) ON DELETE SET NULL,

  -- Human-readable label for which scoreboard fed this session
  -- e.g. 'crg_scoreboard', 'manual', 'unknown'
  scoreboard_source  TEXT        NOT NULL DEFAULT 'unknown',

  -- Lifecycle timestamps
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at           TIMESTAMPTZ,           -- NULL while session is still active

  -- Session state machine: active → completed | abandoned
  status             TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'completed', 'abandoned')),

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.live_games                  IS 'One row per live scoreboard session; optionally linked to a bout.';
COMMENT ON COLUMN public.live_games.scoreboard_source IS 'Identifier for the scoreboard that produced this session (e.g. crg_scoreboard).';
COMMENT ON COLUMN public.live_games.status            IS 'active while the session is running; completed or abandoned once it ends.';


-- ---------------------------------------------------------------------------
-- TABLE: live_jam_snapshots
-- ---------------------------------------------------------------------------
-- Stores one snapshot of scoreboard state per jam boundary.
-- The live-bridge service upserts into this table on every jam transition.
-- The UNIQUE constraint on (live_game_id, period, jam) makes upserts safe.

CREATE TABLE IF NOT EXISTS public.live_jam_snapshots (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent session — cascades so snapshots are cleaned up with the game
  live_game_id     UUID        NOT NULL REFERENCES public.live_games(id) ON DELETE CASCADE,

  -- Jam coordinates (both must be ≥ 1)
  period           INTEGER     NOT NULL CHECK (period >= 1),
  jam              INTEGER     NOT NULL CHECK (jam >= 1),

  -- Running totals at the END of this jam
  team1_score      INTEGER,
  team2_score      INTEGER,

  -- Points scored IN this jam only
  team1_jam_score  INTEGER,
  team2_jam_score  INTEGER,

  -- Jammer derby names / skater numbers for this jam (from scoreboard)
  team1_jammer     TEXT,
  team2_jammer     TEXT,

  -- Lead jammer flags
  team1_lead       BOOLEAN     DEFAULT FALSE,
  team2_lead       BOOLEAN     DEFAULT FALSE,

  -- Full raw JSON payload from the scoreboard API for this jam,
  -- stored for debugging and future data extraction
  raw_state        JSONB,

  captured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one snapshot exists per (game, period, jam) tuple
  -- Allows safe upserts: INSERT … ON CONFLICT (live_game_id, period, jam) DO UPDATE …
  UNIQUE (live_game_id, period, jam)
);

COMMENT ON TABLE  public.live_jam_snapshots              IS 'One row per jam boundary per live session; upserted by the live-bridge service.';
COMMENT ON COLUMN public.live_jam_snapshots.raw_state    IS 'Full raw scoreboard API payload, stored for debugging and future extraction.';
COMMENT ON COLUMN public.live_jam_snapshots.captured_at  IS 'Wall-clock time when the live-bridge wrote this snapshot.';


-- ---------------------------------------------------------------------------
-- TRIGGER: keep live_games.updated_at current
-- ---------------------------------------------------------------------------
-- Reuses the update_updated_at_column() function defined in schema.sql.
-- We DROP + recreate so the script stays idempotent.

DROP TRIGGER IF EXISTS update_live_games_updated_at ON public.live_games;

CREATE TRIGGER update_live_games_updated_at
  BEFORE UPDATE ON public.live_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

-- Fast lookup of all snapshots belonging to a game
-- (used by the overlay UI and bridge service)
CREATE INDEX IF NOT EXISTS idx_live_jam_snapshots_live_game_id
  ON public.live_jam_snapshots (live_game_id);

-- Composite index for the most common query pattern:
-- fetch a specific jam snapshot by (game, period, jam)
-- also serves the UNIQUE constraint look-up efficiently
CREATE INDEX IF NOT EXISTS idx_live_jam_snapshots_game_period_jam
  ON public.live_jam_snapshots (live_game_id, period, jam);

-- Index for filtering live_games by status (e.g. WHERE status = 'active')
CREATE INDEX IF NOT EXISTS idx_live_games_status
  ON public.live_games (status);

-- Index for joining live_games back to bouts
CREATE INDEX IF NOT EXISTS idx_live_games_bout_id
  ON public.live_games (bout_id);


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.live_games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_jam_snapshots  ENABLE ROW LEVEL SECURITY;


-- ── live_games: authenticated user policies ────────────────────────────────
-- Wrap auth.uid() in a sub-select so it is evaluated once per query, not once
-- per row — matches the optimised pattern used by the rest of the schema.

DROP POLICY IF EXISTS "Allow authenticated users to view live_games"   ON public.live_games;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_games"  ON public.live_games;
DROP POLICY IF EXISTS "Allow authenticated users to update live_games"  ON public.live_games;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_games"  ON public.live_games;

CREATE POLICY "Allow authenticated users to view live_games"
  ON public.live_games FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_games"
  ON public.live_games FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_games"
  ON public.live_games FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_games"
  ON public.live_games FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);


-- ── live_games: service_role bypass ───────────────────────────────────────
-- The live-bridge service connects with the service-role key and must be able
-- to write without being blocked by the authenticated-user policies above.

DROP POLICY IF EXISTS "Allow service_role full access to live_games" ON public.live_games;

CREATE POLICY "Allow service_role full access to live_games"
  ON public.live_games FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── live_jam_snapshots: authenticated user policies ────────────────────────

DROP POLICY IF EXISTS "Allow authenticated users to view live_jam_snapshots"   ON public.live_jam_snapshots;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_jam_snapshots"  ON public.live_jam_snapshots;
DROP POLICY IF EXISTS "Allow authenticated users to update live_jam_snapshots"  ON public.live_jam_snapshots;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_jam_snapshots"  ON public.live_jam_snapshots;

CREATE POLICY "Allow authenticated users to view live_jam_snapshots"
  ON public.live_jam_snapshots FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_jam_snapshots"
  ON public.live_jam_snapshots FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_jam_snapshots"
  ON public.live_jam_snapshots FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_jam_snapshots"
  ON public.live_jam_snapshots FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);


-- ── live_jam_snapshots: service_role bypass ───────────────────────────────

DROP POLICY IF EXISTS "Allow service_role full access to live_jam_snapshots" ON public.live_jam_snapshots;

CREATE POLICY "Allow service_role full access to live_jam_snapshots"
  ON public.live_jam_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================================================
-- End of migration 001
-- =============================================================================
