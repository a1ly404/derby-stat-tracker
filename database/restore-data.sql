-- =============================================================================
--
--  DERBY STAT TRACKER — DATA RESTORE
--
--  Restores production data extracted from the Supabase backup:
--    db_cluster-13-10-2025@09-04-31.backup.gz
--
--  This script inserts the actual teams, players, player-team assignments,
--  bouts, and player stats that existed in the original database.  It uses
--  ON CONFLICT … DO NOTHING so it is safe to run multiple times without
--  duplicating rows.
--
--  Run this AFTER setup.sql (or schema.sql + migrations) has been applied.
--
--  NOTE: The setup.sql sample seed data uses different UUIDs from the
--  production data below.  If you ran setup.sql first, the sample rows
--  will coexist harmlessly — or you can DELETE FROM the tables before
--  running this script if you want a clean slate.
--
-- =============================================================================

BEGIN;

-- =========================================================================
-- Clean slate (optional — remove sample seed data from setup.sql)
-- =========================================================================
-- Uncomment the next four lines if you want ONLY the production data
-- and no sample records.

-- DELETE FROM public.player_stats;
-- DELETE FROM public.player_teams;
-- DELETE FROM public.players;
-- DELETE FROM public.bouts;
-- DELETE FROM public.teams;


-- =========================================================================
-- TEAMS
-- =========================================================================
-- 4 teams from the original database.
-- Note: "Belles of the Brawl" (production) vs "Bells of the Brawl" (sample seed).

INSERT INTO public.teams (id, name, logo_url, created_at, updated_at) VALUES
  ('0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b', 'Belles of the Brawl', NULL,
    '2025-09-17 21:09:45.214341+00', '2025-09-26 19:48:48.185863+00'),
  ('569bad22-ef6e-4099-9a71-7631a7f8d9ad', 'Daisy Pushers', NULL,
    '2025-09-17 21:09:45.214341+00', '2025-09-17 21:09:45.214341+00'),
  ('5969b33e-ff53-4bc6-8844-771ed8574e80', 'Margarita Villains', NULL,
    '2025-09-17 21:09:45.214341+00', '2025-09-17 21:09:45.214341+00'),
  ('1e7f3ce6-bc12-4384-9314-2ecb1dc09a26', 'The Hard Cores', NULL,
    '2025-09-17 21:09:45.214341+00', '2025-09-17 21:09:45.214341+00')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- PLAYERS
-- =========================================================================
-- 4 players from the original database.

INSERT INTO public.players (id, derby_name, preferred_number, created_at, updated_at) VALUES
  ('7f815567-227e-4b64-95e4-4ef09d85e383', 'Dita Von Terror', '321',
    '2025-09-17 21:09:45.214341+00', '2025-09-26 17:02:52.272339+00'),
  ('ee657d6e-fbbc-4ee8-8dda-b92d6fe830c8', 'Lylability', '404',
    '2025-09-17 21:09:45.214341+00', '2025-09-26 17:03:06.025932+00'),
  ('c708959e-483c-4d31-b052-1c3f6380381e', 'V-Wrecks', '710',
    '2025-09-26 17:13:49.725434+00', '2025-09-26 17:13:49.725434+00'),
  ('438b5f20-faf3-406e-823c-fd31294158b5', 'Green Bean', '23',
    '2025-09-17 21:09:45.214341+00', '2025-09-26 19:48:33.914443+00')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- PLAYER–TEAM ASSIGNMENTS
-- =========================================================================
-- 5 roster assignments from the original database.
--
--   Dita Von Terror  → Belles of the Brawl  (#321, blocker)
--   Lylability       → Belles of the Brawl  (#404, pivot)
--   Lylability       → The Hard Cores       (#404, pivot)   ← dual roster
--   V-Wrecks         → The Hard Cores       (#710, blocker)
--   Green Bean       → Belles of the Brawl  (#23,  jammer)

INSERT INTO public.player_teams
  (id, player_id, team_id, number, position, is_active, joined_date, created_at, updated_at)
VALUES
  ('adbeaebe-d4ee-496d-aba1-3b09c0ec54dc',
    '7f815567-227e-4b64-95e4-4ef09d85e383',  -- Dita Von Terror
    '0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b',  -- Belles of the Brawl
    '321', 'blocker', TRUE,
    '2025-09-26 17:02:52.595696+00',
    '2025-09-26 17:02:52.595696+00',
    '2025-09-26 17:02:52.595696+00'),

  ('ef429c3e-466a-474a-827d-08de7f280161',
    'ee657d6e-fbbc-4ee8-8dda-b92d6fe830c8',  -- Lylability
    '0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b',  -- Belles of the Brawl
    '404', 'pivot', TRUE,
    '2025-09-26 17:03:06.308113+00',
    '2025-09-26 17:03:06.308113+00',
    '2025-09-26 17:03:06.308113+00'),

  ('65536a51-522e-4f0c-8e7d-7d6483aeda34',
    'ee657d6e-fbbc-4ee8-8dda-b92d6fe830c8',  -- Lylability
    '1e7f3ce6-bc12-4384-9314-2ecb1dc09a26',  -- The Hard Cores
    '404', 'pivot', TRUE,
    '2025-09-26 17:03:06.308113+00',
    '2025-09-26 17:03:06.308113+00',
    '2025-09-26 17:03:06.308113+00'),

  ('92a62ce8-0e9d-4758-b9f4-67fec7942d48',
    'c708959e-483c-4d31-b052-1c3f6380381e',  -- V-Wrecks
    '1e7f3ce6-bc12-4384-9314-2ecb1dc09a26',  -- The Hard Cores
    '710', 'blocker', TRUE,
    '2025-09-26 17:13:49.929747+00',
    '2025-09-26 17:13:49.929747+00',
    '2025-09-26 17:13:49.929747+00'),

  ('eaf87f6a-42eb-4690-9a81-f39f21fad8e8',
    '438b5f20-faf3-406e-823c-fd31294158b5',  -- Green Bean
    '0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b',  -- Belles of the Brawl
    '23', 'jammer', TRUE,
    '2025-09-26 19:48:34.394136+00',
    '2025-09-26 19:48:34.394136+00',
    '2025-09-26 19:48:34.394136+00')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- BOUTS
-- =========================================================================
-- 2 bouts from the original database, both at Archie Browning arena.

INSERT INTO public.bouts
  (id, home_team_id, away_team_id, bout_date, venue, home_score, away_score, status, notes, created_at, updated_at)
VALUES
  -- Bout 1: Belles of the Brawl vs Daisy Pushers — 2 to 6
  ('1dfa65e0-72cf-4925-ba73-a8d70ae9104e',
    '0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b',  -- Belles of the Brawl (home)
    '569bad22-ef6e-4099-9a71-7631a7f8d9ad',  -- Daisy Pushers (away)
    '2025-09-25 12:44:00+00',
    'Archie Browning',
    2, 6, 'completed', NULL,
    '2025-09-25 19:45:02.585647+00',
    '2025-09-26 17:24:32.144019+00'),

  -- Bout 2: Belles of the Brawl vs The Hard Cores
  ('9ace130c-255e-4b9e-95c7-ceea04066baf',
    '0e5bbc5d-b5a2-445f-9c2e-67afd9715c9b',  -- Belles of the Brawl (home)
    '1e7f3ce6-bc12-4384-9314-2ecb1dc09a26',  -- The Hard Cores (away)
    '2025-09-26 10:36:00+00',
    'Archie Browning',
    NULL, NULL, 'completed', NULL,
    '2025-09-26 17:36:32.049753+00',
    '2025-10-02 04:26:38.458879+00')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- PLAYER STATS
-- =========================================================================
-- 7 player-stat records across the two bouts.

INSERT INTO public.player_stats
  (id, player_id, bout_id, jams_played, lead_jammer, points_scored, penalties, blocks, assists, created_at, updated_at)
VALUES
  -- ── Bout 1: Belles of the Brawl vs Daisy Pushers ────────────────────

  -- Dita Von Terror — 3 jams, 0 lead, 0 pts, 0 pen, 2 blocks, 0 assists
  ('92a6e4b9-e4fa-4b27-9d13-b2bafc6ee20d',
    '7f815567-227e-4b64-95e4-4ef09d85e383',
    '1dfa65e0-72cf-4925-ba73-a8d70ae9104e',
    3, 0, 0, 0, 2, 0,
    '2025-09-26 17:03:09.879+00',
    '2025-09-26 17:24:30.945072+00'),

  -- Green Bean — 10 jams, 0 lead, 8 pts, 8 pen, 0 blocks, 0 assists
  ('65783ec9-52e5-4013-a689-d5609ab23eea',
    '438b5f20-faf3-406e-823c-fd31294158b5',
    '1dfa65e0-72cf-4925-ba73-a8d70ae9104e',
    10, 0, 8, 8, 0, 0,
    '2025-09-26 16:34:46.267+00',
    '2025-09-26 17:24:30.945378+00'),

  -- Lylability — 5 jams, 0 lead, 4 pts, 0 pen, 1 block, 8 assists
  ('ed8e3c58-082c-4646-a648-d5d1fb0b1916',
    'ee657d6e-fbbc-4ee8-8dda-b92d6fe830c8',
    '1dfa65e0-72cf-4925-ba73-a8d70ae9104e',
    5, 0, 4, 0, 1, 8,
    '2025-09-26 16:34:46.267+00',
    '2025-09-26 17:24:30.966603+00'),

  -- ── Bout 2: Belles of the Brawl vs The Hard Cores ────────────────────

  -- Dita Von Terror — 1 jam
  ('c262be55-4734-4372-91e1-c9b36d38f013',
    '7f815567-227e-4b64-95e4-4ef09d85e383',
    '9ace130c-255e-4b9e-95c7-ceea04066baf',
    1, 0, 0, 0, 0, 0,
    '2025-09-29 21:29:35.577+00',
    '2025-10-02 04:25:25.87559+00'),

  -- Lylability — 1 jam
  ('6dd1aac7-ed70-4159-b55a-b80f6d6c5945',
    'ee657d6e-fbbc-4ee8-8dda-b92d6fe830c8',
    '9ace130c-255e-4b9e-95c7-ceea04066baf',
    1, 0, 0, 0, 0, 0,
    '2025-09-29 21:29:35.577+00',
    '2025-10-02 04:25:25.877665+00'),

  -- V-Wrecks — 1 jam
  ('e1bf1a77-e314-4edf-9e7a-87576f1587f7',
    'c708959e-483c-4d31-b052-1c3f6380381e',
    '9ace130c-255e-4b9e-95c7-ceea04066baf',
    1, 0, 0, 0, 0, 0,
    '2025-09-29 21:29:35.577+00',
    '2025-10-02 04:25:25.898251+00'),

  -- Green Bean — 1 jam
  ('59da3e4b-eea7-441e-befc-72d34615415c',
    '438b5f20-faf3-406e-823c-fd31294158b5',
    '9ace130c-255e-4b9e-95c7-ceea04066baf',
    1, 0, 0, 0, 0, 0,
    '2025-09-29 21:29:35.577+00',
    '2025-10-02 04:25:26.05383+00')
ON CONFLICT (id) DO NOTHING;


COMMIT;

-- =============================================================================
-- SUMMARY OF RESTORED DATA
-- =============================================================================
--
--  Teams (4):
--    • Belles of the Brawl     (home team, most roster members)
--    • Daisy Pushers
--    • Margarita Villains
--    • The Hard Cores
--
--  Players (4):
--    • Dita Von Terror  #321   — Belles of the Brawl (blocker)
--    • Lylability       #404   — Belles of the Brawl (pivot) + The Hard Cores (pivot)
--    • V-Wrecks         #710   — The Hard Cores (blocker)
--    • Green Bean        #23   — Belles of the Brawl (jammer)
--
--  Bouts (2):
--    • 2025-09-25  Belles vs Daisy Pushers   @ Archie Browning  (2–6, completed)
--    • 2025-09-26  Belles vs The Hard Cores   @ Archie Browning  (completed)
--
--  Player Stats (7):
--    • Bout 1: Dita (3j/0p/2b), Green Bean (10j/8p/8pen), Lylability (5j/4p/8a)
--    • Bout 2: Dita (1j), Lylability (1j), V-Wrecks (1j), Green Bean (1j)
--
--  Storage: Empty (original storage bucket had no objects)
--
-- =============================================================================
