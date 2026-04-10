-- =============================================================================
-- Migration 002: Live Scoreboard Digest Tables
-- =============================================================================
-- Adds tables and a digest function for processing the rich data captured in
-- live_jam_snapshots.raw_state into normalised, queryable tables.
--
-- New tables:
--   • live_jam_lineups        — per-position per-team per-jam lineup records
--   • live_timeout_events     — timeout/review events during a live game
--   • live_skater_game_stats  — aggregated per-skater stats for a game
--   • live_game_digests       — single-row summary for a completed game
--
-- New function:
--   • digest_live_game(UUID)  — extracts raw_state JSONB into the above tables
--
-- Prerequisites:
--   • schema.sql        — core tables + update_updated_at_column() function
--   • 001_live_tables.sql — live_games + live_jam_snapshots tables
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================


-- =========================================================================
-- TABLE: live_jam_lineups
-- =========================================================================
-- One row per skater position per team per jam.  Each jam produces up to 10
-- rows (5 positions × 2 teams).  Extracted from raw_state JSONB by the
-- digest_live_game() function.
--
-- This is the foundation table for building per-skater statistics.

CREATE TABLE IF NOT EXISTS public.live_jam_lineups (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  live_game_id     UUID        NOT NULL REFERENCES public.live_games(id) ON DELETE CASCADE,
  period           INTEGER     NOT NULL CHECK (period >= 1),
  jam              INTEGER     NOT NULL CHECK (jam >= 1),

  -- Which team: 1 or 2
  team_num         SMALLINT    NOT NULL CHECK (team_num IN (1, 2)),

  -- Position on the track
  position         TEXT        NOT NULL CHECK (position IN (
                     'jammer', 'pivot', 'blocker1', 'blocker2', 'blocker3'
                   )),

  -- Skater identity as reported by the scoreboard
  skater_name      TEXT,
  skater_number    TEXT,

  -- Penalty box status at the time of the snapshot
  in_box           BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Jam-level flags (only meaningful for jammer position, NULL for others)
  had_lead         BOOLEAN,
  lost_lead        BOOLEAN,
  called_off       BOOLEAN,
  star_pass        BOOLEAN,

  -- Per-jam score (only set on the jammer row for convenience)
  jam_score        INTEGER,

  -- Optional link to the players table if we can match by name or number.
  -- Populated by a secondary reconciliation step, not by the initial digest.
  player_id        UUID        REFERENCES public.players(id) ON DELETE SET NULL,

  captured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per position per team per jam per game
  UNIQUE (live_game_id, period, jam, team_num, position)
);

COMMENT ON TABLE  public.live_jam_lineups             IS 'Per-position per-team per-jam lineup records extracted from raw_state JSONB.';
COMMENT ON COLUMN public.live_jam_lineups.player_id   IS 'Optional FK to players table, populated by reconciliation after digest.';
COMMENT ON COLUMN public.live_jam_lineups.jam_score   IS 'Per-jam score; set on the jammer row for convenience.';


-- =========================================================================
-- TABLE: live_timeout_events
-- =========================================================================
-- One row per timeout/official-review that occurred during a live game.
-- Extracted from raw_state JSONB where game_state indicates a timeout.

CREATE TABLE IF NOT EXISTS public.live_timeout_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  live_game_id     UUID        NOT NULL REFERENCES public.live_games(id) ON DELETE CASCADE,

  -- When in the game the timeout occurred (the jam BEFORE the timeout)
  period           INTEGER     NOT NULL CHECK (period >= 1),
  after_jam        INTEGER     NOT NULL CHECK (after_jam >= 0),

  -- Timeout classification
  -- team_timeout | official_timeout | official_review | unknown
  timeout_type     TEXT        NOT NULL DEFAULT 'unknown',

  -- Who called it: '1' (team 1), '2' (team 2), 'O' (officials), or NULL
  timeout_owner    TEXT,

  -- Remaining resources AFTER this timeout
  team1_timeouts_remaining          INTEGER,
  team1_official_reviews_remaining  INTEGER,
  team2_timeouts_remaining          INTEGER,
  team2_official_reviews_remaining  INTEGER,

  -- Was an official review retained?
  team1_retained_review   BOOLEAN DEFAULT FALSE,
  team2_retained_review   BOOLEAN DEFAULT FALSE,

  captured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate timeout records for the same moment
  UNIQUE (live_game_id, period, after_jam, timeout_type, timeout_owner)
);

COMMENT ON TABLE  public.live_timeout_events IS 'Timeout and official review events extracted from live scoreboard data.';


-- =========================================================================
-- TABLE: live_skater_game_stats
-- =========================================================================
-- Aggregated per-skater stats for a single live game.  One row per unique
-- skater identity (name + number) per game.  Computed by digest_live_game().

CREATE TABLE IF NOT EXISTS public.live_skater_game_stats (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  live_game_id     UUID        NOT NULL REFERENCES public.live_games(id) ON DELETE CASCADE,

  -- Which team the skater played on
  team_num         SMALLINT    NOT NULL CHECK (team_num IN (1, 2)),
  team_name        TEXT,

  -- Skater identity
  skater_name      TEXT,
  skater_number    TEXT,

  -- Jam counts by position
  jams_played      INTEGER     NOT NULL DEFAULT 0,
  jams_as_jammer   INTEGER     NOT NULL DEFAULT 0,
  jams_as_pivot    INTEGER     NOT NULL DEFAULT 0,
  jams_as_blocker  INTEGER     NOT NULL DEFAULT 0,

  -- Jammer-specific stats
  lead_jams        INTEGER     NOT NULL DEFAULT 0,
  lost_lead_jams   INTEGER     NOT NULL DEFAULT 0,
  calloff_jams     INTEGER     NOT NULL DEFAULT 0,
  star_pass_jams   INTEGER     NOT NULL DEFAULT 0,
  total_points     INTEGER     NOT NULL DEFAULT 0,

  -- Penalty stats
  total_box_trips  INTEGER     NOT NULL DEFAULT 0,

  -- Optional link to the players table
  player_id        UUID        REFERENCES public.players(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One stat row per skater identity per game
  UNIQUE (live_game_id, team_num, skater_name, skater_number)
);

COMMENT ON TABLE  public.live_skater_game_stats IS 'Aggregated per-skater stats for a live game, computed by digest_live_game().';


-- =========================================================================
-- TABLE: live_game_digests
-- =========================================================================
-- Single-row summary for a completed live game.  Populated once by
-- digest_live_game() after a game ends.

CREATE TABLE IF NOT EXISTS public.live_game_digests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  live_game_id     UUID        NOT NULL UNIQUE REFERENCES public.live_games(id) ON DELETE CASCADE,

  -- Team names as they appeared on the scoreboard
  team1_name       TEXT,
  team2_name       TEXT,

  -- Final scores
  team1_final_score  INTEGER   NOT NULL DEFAULT 0,
  team2_final_score  INTEGER   NOT NULL DEFAULT 0,

  -- Game structure
  total_periods    INTEGER     NOT NULL DEFAULT 0,
  total_jams       INTEGER     NOT NULL DEFAULT 0,

  -- Lead jam counts
  team1_lead_jams  INTEGER     NOT NULL DEFAULT 0,
  team2_lead_jams  INTEGER     NOT NULL DEFAULT 0,

  -- Star pass counts
  team1_star_passes  INTEGER   NOT NULL DEFAULT 0,
  team2_star_passes  INTEGER   NOT NULL DEFAULT 0,

  -- Timeout/review usage
  team1_timeouts_used          INTEGER NOT NULL DEFAULT 0,
  team2_timeouts_used          INTEGER NOT NULL DEFAULT 0,
  team1_official_reviews_used  INTEGER NOT NULL DEFAULT 0,
  team2_official_reviews_used  INTEGER NOT NULL DEFAULT 0,

  -- Penalty box trip totals
  team1_total_box_trips  INTEGER NOT NULL DEFAULT 0,
  team2_total_box_trips  INTEGER NOT NULL DEFAULT 0,

  -- Timing
  game_started_at  TIMESTAMPTZ,
  game_ended_at    TIMESTAMPTZ,

  -- Biggest lead (positive = team 1 ahead, negative = team 2 ahead)
  max_lead         INTEGER     NOT NULL DEFAULT 0,
  max_lead_team    SMALLINT,   -- 1 or 2

  -- Closest the score ever got after the first jam
  closest_margin   INTEGER     NOT NULL DEFAULT 0,

  -- When the digest was computed
  digested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.live_game_digests IS 'Single-row game summary computed by digest_live_game() after a game ends.';


-- =========================================================================
-- TRIGGERS: keep updated_at current
-- =========================================================================

DROP TRIGGER IF EXISTS update_live_skater_game_stats_updated_at ON public.live_skater_game_stats;
CREATE TRIGGER update_live_skater_game_stats_updated_at
  BEFORE UPDATE ON public.live_skater_game_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_game_digests_updated_at ON public.live_game_digests;
CREATE TRIGGER update_live_game_digests_updated_at
  BEFORE UPDATE ON public.live_game_digests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =========================================================================
-- INDEXES
-- =========================================================================

-- live_jam_lineups
CREATE INDEX IF NOT EXISTS idx_live_jam_lineups_game_id
  ON public.live_jam_lineups (live_game_id);

CREATE INDEX IF NOT EXISTS idx_live_jam_lineups_game_period_jam
  ON public.live_jam_lineups (live_game_id, period, jam);

CREATE INDEX IF NOT EXISTS idx_live_jam_lineups_skater
  ON public.live_jam_lineups (skater_name, skater_number);

CREATE INDEX IF NOT EXISTS idx_live_jam_lineups_player_id
  ON public.live_jam_lineups (player_id) WHERE player_id IS NOT NULL;

-- live_timeout_events
CREATE INDEX IF NOT EXISTS idx_live_timeout_events_game_id
  ON public.live_timeout_events (live_game_id);

-- live_skater_game_stats
CREATE INDEX IF NOT EXISTS idx_live_skater_game_stats_game_id
  ON public.live_skater_game_stats (live_game_id);

CREATE INDEX IF NOT EXISTS idx_live_skater_game_stats_player_id
  ON public.live_skater_game_stats (player_id) WHERE player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_skater_game_stats_skater
  ON public.live_skater_game_stats (skater_name, skater_number);

-- live_game_digests
CREATE INDEX IF NOT EXISTS idx_live_game_digests_game_id
  ON public.live_game_digests (live_game_id);


-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

ALTER TABLE public.live_jam_lineups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_timeout_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_skater_game_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_digests       ENABLE ROW LEVEL SECURITY;


-- ── live_jam_lineups: authenticated + service_role ─────────────────────────

DROP POLICY IF EXISTS "Allow authenticated users to view live_jam_lineups"   ON public.live_jam_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_jam_lineups"  ON public.live_jam_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to update live_jam_lineups"  ON public.live_jam_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_jam_lineups"  ON public.live_jam_lineups;

CREATE POLICY "Allow authenticated users to view live_jam_lineups"
  ON public.live_jam_lineups FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_jam_lineups"
  ON public.live_jam_lineups FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_jam_lineups"
  ON public.live_jam_lineups FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_jam_lineups"
  ON public.live_jam_lineups FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow service_role full access to live_jam_lineups" ON public.live_jam_lineups;
CREATE POLICY "Allow service_role full access to live_jam_lineups"
  ON public.live_jam_lineups FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ── live_timeout_events: authenticated + service_role ──────────────────────

DROP POLICY IF EXISTS "Allow authenticated users to view live_timeout_events"   ON public.live_timeout_events;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_timeout_events"  ON public.live_timeout_events;
DROP POLICY IF EXISTS "Allow authenticated users to update live_timeout_events"  ON public.live_timeout_events;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_timeout_events"  ON public.live_timeout_events;

CREATE POLICY "Allow authenticated users to view live_timeout_events"
  ON public.live_timeout_events FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_timeout_events"
  ON public.live_timeout_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_timeout_events"
  ON public.live_timeout_events FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_timeout_events"
  ON public.live_timeout_events FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow service_role full access to live_timeout_events" ON public.live_timeout_events;
CREATE POLICY "Allow service_role full access to live_timeout_events"
  ON public.live_timeout_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ── live_skater_game_stats: authenticated + service_role ───────────────────

DROP POLICY IF EXISTS "Allow authenticated users to view live_skater_game_stats"   ON public.live_skater_game_stats;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_skater_game_stats"  ON public.live_skater_game_stats;
DROP POLICY IF EXISTS "Allow authenticated users to update live_skater_game_stats"  ON public.live_skater_game_stats;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_skater_game_stats"  ON public.live_skater_game_stats;

CREATE POLICY "Allow authenticated users to view live_skater_game_stats"
  ON public.live_skater_game_stats FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_skater_game_stats"
  ON public.live_skater_game_stats FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_skater_game_stats"
  ON public.live_skater_game_stats FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_skater_game_stats"
  ON public.live_skater_game_stats FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow service_role full access to live_skater_game_stats" ON public.live_skater_game_stats;
CREATE POLICY "Allow service_role full access to live_skater_game_stats"
  ON public.live_skater_game_stats FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ── live_game_digests: authenticated + service_role ────────────────────────

DROP POLICY IF EXISTS "Allow authenticated users to view live_game_digests"   ON public.live_game_digests;
DROP POLICY IF EXISTS "Allow authenticated users to insert live_game_digests"  ON public.live_game_digests;
DROP POLICY IF EXISTS "Allow authenticated users to update live_game_digests"  ON public.live_game_digests;
DROP POLICY IF EXISTS "Allow authenticated users to delete live_game_digests"  ON public.live_game_digests;

CREATE POLICY "Allow authenticated users to view live_game_digests"
  ON public.live_game_digests FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert live_game_digests"
  ON public.live_game_digests FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update live_game_digests"
  ON public.live_game_digests FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete live_game_digests"
  ON public.live_game_digests FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow service_role full access to live_game_digests" ON public.live_game_digests;
CREATE POLICY "Allow service_role full access to live_game_digests"
  ON public.live_game_digests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- =========================================================================
-- FUNCTION: digest_live_game(game_id UUID)
-- =========================================================================
-- Processes all live_jam_snapshots for the given game, extracting the
-- raw_state JSONB into the normalised digest tables.
--
-- Safe to call multiple times — deletes existing digest data for the game
-- before re-inserting so the result is always consistent.
--
-- Usage:
--   SELECT digest_live_game('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
--
-- The live-bridge can call this when a game transitions to 'completed',
-- or it can be invoked manually from the Supabase SQL editor.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.digest_live_game(p_game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_snapshot     RECORD;
  v_raw          JSONB;
  v_team_num     SMALLINT;
  v_team_key     TEXT;
  v_positions    TEXT[] := ARRAY['jammer', 'pivot', 'blocker1', 'blocker2', 'blocker3'];
  v_pos          TEXT;
  v_skater       JSONB;
  v_team_obj     JSONB;
  v_prev_jam     INTEGER := 0;
  v_prev_period  INTEGER := 0;
  v_last_game_state TEXT;
BEGIN
  -- ── Guard: game must exist ────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM public.live_games WHERE id = p_game_id) THEN
    RAISE EXCEPTION 'live_games row not found for id %', p_game_id;
  END IF;

  -- ── Clear previous digest data (makes re-runs idempotent) ─────────────
  DELETE FROM public.live_jam_lineups       WHERE live_game_id = p_game_id;
  DELETE FROM public.live_timeout_events    WHERE live_game_id = p_game_id;
  DELETE FROM public.live_skater_game_stats WHERE live_game_id = p_game_id;
  DELETE FROM public.live_game_digests      WHERE live_game_id = p_game_id;

  -- =====================================================================
  -- PHASE 1: Extract lineups and detect timeouts from each jam snapshot
  -- =====================================================================

  FOR v_snapshot IN
    SELECT period, jam, raw_state, captured_at
    FROM public.live_jam_snapshots
    WHERE live_game_id = p_game_id
      AND raw_state IS NOT NULL
    ORDER BY period ASC, jam ASC
  LOOP
    v_raw := v_snapshot.raw_state;

    -- ── Extract lineups for each team ─────────────────────────────────
    FOR v_team_num IN 1..2 LOOP
      v_team_key := 'team' || v_team_num;
      v_team_obj := v_raw -> v_team_key;

      -- Skip if team object is null
      CONTINUE WHEN v_team_obj IS NULL OR v_team_obj = 'null'::jsonb;

      FOREACH v_pos IN ARRAY v_positions LOOP
        v_skater := v_team_obj -> v_pos;

        -- The scoreboard API nests jammer/pivot/blocker as objects with
        -- {name, number, in_box, ...}.  Older bridge versions stored
        -- jammer as a bare string in team.jammer — handle both.
        IF v_skater IS NOT NULL AND jsonb_typeof(v_skater) = 'object' THEN
          INSERT INTO public.live_jam_lineups (
            live_game_id, period, jam, team_num, position,
            skater_name, skater_number, in_box,
            had_lead, lost_lead, called_off, star_pass,
            jam_score, captured_at
          ) VALUES (
            p_game_id,
            v_snapshot.period,
            v_snapshot.jam,
            v_team_num,
            v_pos,
            -- Skater identity
            v_skater ->> 'name',
            v_skater ->> 'number',
            COALESCE((v_skater ->> 'in_box')::boolean, FALSE),
            -- Jam-level flags (only on jammer position)
            CASE WHEN v_pos = 'jammer' THEN (v_team_obj ->> 'lead')::boolean END,
            CASE WHEN v_pos = 'jammer' THEN (v_team_obj ->> 'lost')::boolean END,
            CASE WHEN v_pos = 'jammer' THEN (v_team_obj ->> 'calloff')::boolean END,
            CASE WHEN v_pos = 'jammer' THEN (v_team_obj ->> 'star_pass')::boolean END,
            CASE WHEN v_pos = 'jammer' THEN (v_team_obj ->> 'jam_score')::integer END,
            v_snapshot.captured_at
          )
          ON CONFLICT (live_game_id, period, jam, team_num, position)
          DO UPDATE SET
            skater_name  = EXCLUDED.skater_name,
            skater_number = EXCLUDED.skater_number,
            in_box       = EXCLUDED.in_box,
            had_lead     = EXCLUDED.had_lead,
            lost_lead    = EXCLUDED.lost_lead,
            called_off   = EXCLUDED.called_off,
            star_pass    = EXCLUDED.star_pass,
            jam_score    = EXCLUDED.jam_score,
            captured_at  = EXCLUDED.captured_at;

        ELSIF v_pos = 'jammer' AND (v_skater IS NULL OR jsonb_typeof(v_skater) <> 'object') THEN
          -- Fallback: older bridge stored jammer as a bare string in team.jammer
          INSERT INTO public.live_jam_lineups (
            live_game_id, period, jam, team_num, position,
            skater_name, skater_number, in_box,
            had_lead, jam_score, captured_at
          ) VALUES (
            p_game_id,
            v_snapshot.period,
            v_snapshot.jam,
            v_team_num,
            'jammer',
            v_team_obj ->> 'jammer',
            NULL,
            FALSE,
            (v_team_obj ->> 'lead')::boolean,
            (v_team_obj ->> 'jam_score')::integer,
            v_snapshot.captured_at
          )
          ON CONFLICT (live_game_id, period, jam, team_num, position)
          DO UPDATE SET
            skater_name = EXCLUDED.skater_name,
            had_lead    = EXCLUDED.had_lead,
            jam_score   = EXCLUDED.jam_score,
            captured_at = EXCLUDED.captured_at;
        END IF;
      END LOOP;
    END LOOP;

    -- ── Detect timeout events ─────────────────────────────────────────
    -- A timeout is identified when raw_state.game_state contains
    -- 'Timeout' or 'timeout'.  We record it once per period+jam boundary.
    v_last_game_state := v_raw ->> 'game_state';

    IF v_last_game_state IS NOT NULL
       AND lower(v_last_game_state) LIKE '%timeout%'
       AND (v_snapshot.period <> v_prev_period OR v_snapshot.jam <> v_prev_jam)
    THEN
      INSERT INTO public.live_timeout_events (
        live_game_id, period, after_jam,
        timeout_type, timeout_owner,
        team1_timeouts_remaining, team1_official_reviews_remaining,
        team2_timeouts_remaining, team2_official_reviews_remaining,
        team1_retained_review, team2_retained_review,
        captured_at
      ) VALUES (
        p_game_id,
        v_snapshot.period,
        v_snapshot.jam,
        COALESCE(v_raw ->> 'timeout_type', 'unknown'),
        v_raw ->> 'timeout_owner',
        (v_raw -> 'team1' ->> 'timeouts_remaining')::integer,
        (v_raw -> 'team1' ->> 'official_reviews_remaining')::integer,
        (v_raw -> 'team2' ->> 'timeouts_remaining')::integer,
        (v_raw -> 'team2' ->> 'official_reviews_remaining')::integer,
        COALESCE((v_raw -> 'team1' ->> 'retained_official_review')::boolean, FALSE),
        COALESCE((v_raw -> 'team2' ->> 'retained_official_review')::boolean, FALSE),
        v_snapshot.captured_at
      )
      ON CONFLICT (live_game_id, period, after_jam, timeout_type, timeout_owner)
      DO NOTHING;
    END IF;

    v_prev_period := v_snapshot.period;
    v_prev_jam    := v_snapshot.jam;
  END LOOP;

  -- =====================================================================
  -- PHASE 2: Aggregate skater stats from extracted lineups
  -- =====================================================================

  INSERT INTO public.live_skater_game_stats (
    live_game_id, team_num, team_name,
    skater_name, skater_number,
    jams_played, jams_as_jammer, jams_as_pivot, jams_as_blocker,
    lead_jams, lost_lead_jams, calloff_jams, star_pass_jams,
    total_points, total_box_trips
  )
  SELECT
    p_game_id,
    lj.team_num,
    -- Grab team name from the last snapshot's raw_state
    (
      SELECT s.raw_state -> ('team' || lj.team_num) ->> 'name'
      FROM public.live_jam_snapshots s
      WHERE s.live_game_id = p_game_id AND s.raw_state IS NOT NULL
      ORDER BY s.period DESC, s.jam DESC
      LIMIT 1
    ),
    lj.skater_name,
    lj.skater_number,
    -- Jam counts
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE lj.position = 'jammer')::integer,
    COUNT(*) FILTER (WHERE lj.position = 'pivot')::integer,
    COUNT(*) FILTER (WHERE lj.position IN ('blocker1', 'blocker2', 'blocker3'))::integer,
    -- Jammer stats
    COUNT(*) FILTER (WHERE lj.had_lead = TRUE)::integer,
    COUNT(*) FILTER (WHERE lj.lost_lead = TRUE)::integer,
    COUNT(*) FILTER (WHERE lj.called_off = TRUE)::integer,
    COUNT(*) FILTER (WHERE lj.star_pass = TRUE)::integer,
    COALESCE(SUM(lj.jam_score) FILTER (WHERE lj.position = 'jammer'), 0)::integer,
    -- Penalty box trips
    COUNT(*) FILTER (WHERE lj.in_box = TRUE)::integer
  FROM public.live_jam_lineups lj
  WHERE lj.live_game_id = p_game_id
    AND lj.skater_name IS NOT NULL
  GROUP BY lj.team_num, lj.skater_name, lj.skater_number
  ON CONFLICT (live_game_id, team_num, skater_name, skater_number)
  DO UPDATE SET
    team_name       = EXCLUDED.team_name,
    jams_played     = EXCLUDED.jams_played,
    jams_as_jammer  = EXCLUDED.jams_as_jammer,
    jams_as_pivot   = EXCLUDED.jams_as_pivot,
    jams_as_blocker = EXCLUDED.jams_as_blocker,
    lead_jams       = EXCLUDED.lead_jams,
    lost_lead_jams  = EXCLUDED.lost_lead_jams,
    calloff_jams    = EXCLUDED.calloff_jams,
    star_pass_jams  = EXCLUDED.star_pass_jams,
    total_points    = EXCLUDED.total_points,
    total_box_trips = EXCLUDED.total_box_trips;

  -- =====================================================================
  -- PHASE 3: Compute game digest summary
  -- =====================================================================

  INSERT INTO public.live_game_digests (
    live_game_id,
    team1_name, team2_name,
    team1_final_score, team2_final_score,
    total_periods, total_jams,
    team1_lead_jams, team2_lead_jams,
    team1_star_passes, team2_star_passes,
    team1_timeouts_used, team2_timeouts_used,
    team1_official_reviews_used, team2_official_reviews_used,
    team1_total_box_trips, team2_total_box_trips,
    game_started_at, game_ended_at,
    max_lead, max_lead_team,
    closest_margin,
    digested_at
  )
  SELECT
    p_game_id,

    -- Team names from last snapshot
    last_snap.team1_name,
    last_snap.team2_name,

    -- Final scores from last snapshot
    COALESCE(last_snap.team1_score, 0),
    COALESCE(last_snap.team2_score, 0),

    -- Game structure
    COALESCE(last_snap.max_period, 0),
    COALESCE(jam_counts.total_jams, 0),

    -- Lead jams
    COALESCE(lead_counts.team1_lead, 0),
    COALESCE(lead_counts.team2_lead, 0),

    -- Star passes
    COALESCE(star_counts.team1_sp, 0),
    COALESCE(star_counts.team2_sp, 0),

    -- Timeouts used (3 minus remaining = used)
    GREATEST(0, 3 - COALESCE(last_snap.team1_to_remaining, 3)),
    GREATEST(0, 3 - COALESCE(last_snap.team2_to_remaining, 3)),

    -- Official reviews used (1 minus remaining, unless retained)
    GREATEST(0, 1 - COALESCE(last_snap.team1_or_remaining, 1)),
    GREATEST(0, 1 - COALESCE(last_snap.team2_or_remaining, 1)),

    -- Box trips
    COALESCE(box_counts.team1_box, 0),
    COALESCE(box_counts.team2_box, 0),

    -- Timing
    game_times.started_at,
    game_times.ended_at,

    -- Max lead
    COALESCE(score_extremes.max_lead, 0),
    score_extremes.max_lead_team,

    -- Closest margin
    COALESCE(score_extremes.closest_margin, 0),

    NOW()

  FROM (
    -- Last snapshot data
    SELECT
      s.raw_state -> 'team1' ->> 'name'                           AS team1_name,
      s.raw_state -> 'team2' ->> 'name'                           AS team2_name,
      COALESCE(s.team1_score, 0)                                   AS team1_score,
      COALESCE(s.team2_score, 0)                                   AS team2_score,
      s.period                                                     AS max_period,
      (s.raw_state -> 'team1' ->> 'timeouts_remaining')::integer   AS team1_to_remaining,
      (s.raw_state -> 'team2' ->> 'timeouts_remaining')::integer   AS team2_to_remaining,
      (s.raw_state -> 'team1' ->> 'official_reviews_remaining')::integer AS team1_or_remaining,
      (s.raw_state -> 'team2' ->> 'official_reviews_remaining')::integer AS team2_or_remaining
    FROM public.live_jam_snapshots s
    WHERE s.live_game_id = p_game_id AND s.raw_state IS NOT NULL
    ORDER BY s.period DESC, s.jam DESC
    LIMIT 1
  ) last_snap

  CROSS JOIN (
    SELECT COUNT(*)::integer AS total_jams
    FROM public.live_jam_snapshots
    WHERE live_game_id = p_game_id
  ) jam_counts

  CROSS JOIN (
    SELECT
      COUNT(*) FILTER (WHERE team1_lead = TRUE)::integer AS team1_lead,
      COUNT(*) FILTER (WHERE team2_lead = TRUE)::integer AS team2_lead
    FROM public.live_jam_snapshots
    WHERE live_game_id = p_game_id
  ) lead_counts

  CROSS JOIN (
    SELECT
      COUNT(*) FILTER (WHERE team_num = 1 AND star_pass = TRUE)::integer AS team1_sp,
      COUNT(*) FILTER (WHERE team_num = 2 AND star_pass = TRUE)::integer AS team2_sp
    FROM public.live_jam_lineups
    WHERE live_game_id = p_game_id AND position = 'jammer'
  ) star_counts

  CROSS JOIN (
    SELECT
      COUNT(*) FILTER (WHERE team_num = 1)::integer AS team1_box,
      COUNT(*) FILTER (WHERE team_num = 2)::integer AS team2_box
    FROM public.live_jam_lineups
    WHERE live_game_id = p_game_id AND in_box = TRUE
  ) box_counts

  CROSS JOIN (
    SELECT
      lg.started_at,
      lg.ended_at
    FROM public.live_games lg
    WHERE lg.id = p_game_id
  ) game_times

  CROSS JOIN (
    SELECT
      MAX(ABS(COALESCE(s.team1_score, 0) - COALESCE(s.team2_score, 0)))::integer AS max_lead,
      CASE
        WHEN MAX(COALESCE(s.team1_score, 0) - COALESCE(s.team2_score, 0))
           >= ABS(MIN(COALESCE(s.team1_score, 0) - COALESCE(s.team2_score, 0)))
        THEN 1
        ELSE 2
      END AS max_lead_team,
      MIN(ABS(COALESCE(s.team1_score, 0) - COALESCE(s.team2_score, 0)))::integer AS closest_margin
    FROM public.live_jam_snapshots s
    WHERE s.live_game_id = p_game_id
  ) score_extremes

  ON CONFLICT (live_game_id) DO UPDATE SET
    team1_name              = EXCLUDED.team1_name,
    team2_name              = EXCLUDED.team2_name,
    team1_final_score       = EXCLUDED.team1_final_score,
    team2_final_score       = EXCLUDED.team2_final_score,
    total_periods           = EXCLUDED.total_periods,
    total_jams              = EXCLUDED.total_jams,
    team1_lead_jams         = EXCLUDED.team1_lead_jams,
    team2_lead_jams         = EXCLUDED.team2_lead_jams,
    team1_star_passes       = EXCLUDED.team1_star_passes,
    team2_star_passes       = EXCLUDED.team2_star_passes,
    team1_timeouts_used     = EXCLUDED.team1_timeouts_used,
    team2_timeouts_used     = EXCLUDED.team2_timeouts_used,
    team1_official_reviews_used = EXCLUDED.team1_official_reviews_used,
    team2_official_reviews_used = EXCLUDED.team2_official_reviews_used,
    team1_total_box_trips   = EXCLUDED.team1_total_box_trips,
    team2_total_box_trips   = EXCLUDED.team2_total_box_trips,
    game_started_at         = EXCLUDED.game_started_at,
    game_ended_at           = EXCLUDED.game_ended_at,
    max_lead                = EXCLUDED.max_lead,
    max_lead_team           = EXCLUDED.max_lead_team,
    closest_margin          = EXCLUDED.closest_margin,
    digested_at             = NOW();

  -- =====================================================================
  -- PHASE 4: Attempt player reconciliation
  -- =====================================================================
  -- Try to match skaters to existing players table entries by derby name
  -- or number.  This is best-effort — unmatched skaters keep player_id NULL.

  -- Match by exact derby name (case-insensitive)
  UPDATE public.live_jam_lineups lj
  SET player_id = p.id
  FROM public.players p
  WHERE lj.live_game_id = p_game_id
    AND lj.player_id IS NULL
    AND lj.skater_name IS NOT NULL
    AND lower(lj.skater_name) = lower(p.derby_name);

  -- Also update skater game stats with the matched player_id
  UPDATE public.live_skater_game_stats sgs
  SET player_id = p.id
  FROM public.players p
  WHERE sgs.live_game_id = p_game_id
    AND sgs.player_id IS NULL
    AND sgs.skater_name IS NOT NULL
    AND lower(sgs.skater_name) = lower(p.derby_name);

END;
$$;

COMMENT ON FUNCTION public.digest_live_game(UUID) IS
  'Extracts raw_state JSONB from live_jam_snapshots into normalised digest tables. Safe to call multiple times.';


-- =========================================================================
-- FUNCTION: reconcile_live_players(game_id UUID)
-- =========================================================================
-- Attempts to link live_jam_lineups and live_skater_game_stats rows to
-- existing players table entries.  Run this after importing new players
-- or after manually correcting skater names from the scoreboard.
--
-- Matching strategy (in priority order):
--   1. Exact derby_name match (case-insensitive)
--   2. Exact preferred_number match when name is NULL but number is present

CREATE OR REPLACE FUNCTION public.reconcile_live_players(p_game_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_matched INTEGER := 0;
  v_count   INTEGER;
BEGIN
  -- Strategy 1: match by derby name
  UPDATE public.live_jam_lineups lj
  SET player_id = p.id
  FROM public.players p
  WHERE lj.live_game_id = p_game_id
    AND lj.player_id IS NULL
    AND lj.skater_name IS NOT NULL
    AND lower(lj.skater_name) = lower(p.derby_name);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_matched := v_matched + v_count;

  -- Strategy 2: match by number when name is missing
  UPDATE public.live_jam_lineups lj
  SET player_id = p.id
  FROM public.players p
  WHERE lj.live_game_id = p_game_id
    AND lj.player_id IS NULL
    AND lj.skater_name IS NULL
    AND lj.skater_number IS NOT NULL
    AND lj.skater_number = p.preferred_number;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_matched := v_matched + v_count;

  -- Propagate to skater game stats
  UPDATE public.live_skater_game_stats sgs
  SET player_id = sub.player_id
  FROM (
    SELECT DISTINCT ON (team_num, skater_name, skater_number)
      team_num, skater_name, skater_number, player_id
    FROM public.live_jam_lineups
    WHERE live_game_id = p_game_id AND player_id IS NOT NULL
    ORDER BY team_num, skater_name, skater_number, captured_at DESC
  ) sub
  WHERE sgs.live_game_id = p_game_id
    AND sgs.player_id IS NULL
    AND sgs.team_num = sub.team_num
    AND sgs.skater_name IS NOT DISTINCT FROM sub.skater_name
    AND sgs.skater_number IS NOT DISTINCT FROM sub.skater_number;

  RETURN v_matched;
END;
$$;

COMMENT ON FUNCTION public.reconcile_live_players(UUID) IS
  'Links live lineup/stats rows to players table entries by name or number. Returns the number of rows matched.';


-- =============================================================================
-- End of migration 002
-- =============================================================================
