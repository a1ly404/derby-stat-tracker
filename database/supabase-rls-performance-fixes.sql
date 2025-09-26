-- Supabase RLS Performance Fixes
-- Run these commands in your Supabase SQL editor to fix the auth RLS initialization plan warnings

-- Fix teams table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view teams" ON public.teams;
DROP POLICY IF EXISTS "Allow authenticated users to insert teams" ON public.teams;
DROP POLICY IF EXISTS "Allow authenticated users to update teams" ON public.teams;
DROP POLICY IF EXISTS "Allow authenticated users to delete teams" ON public.teams;

CREATE POLICY "Allow authenticated users to view teams" ON public.teams
    FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert teams" ON public.teams
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update teams" ON public.teams
    FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete teams" ON public.teams
    FOR DELETE USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix players table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to insert players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to update players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to delete players" ON public.players;

CREATE POLICY "Allow authenticated users to view players" ON public.players
    FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert players" ON public.players
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update players" ON public.players
    FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete players" ON public.players
    FOR DELETE USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix player_teams table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view player_teams" ON public.player_teams;
DROP POLICY IF EXISTS "Allow authenticated users to insert player_teams" ON public.player_teams;
DROP POLICY IF EXISTS "Allow authenticated users to update player_teams" ON public.player_teams;
DROP POLICY IF EXISTS "Allow authenticated users to delete player_teams" ON public.player_teams;

CREATE POLICY "Allow authenticated users to view player_teams" ON public.player_teams
    FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert player_teams" ON public.player_teams
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update player_teams" ON public.player_teams
    FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete player_teams" ON public.player_teams
    FOR DELETE USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix bouts table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view bouts" ON public.bouts;
DROP POLICY IF EXISTS "Allow authenticated users to insert bouts" ON public.bouts;
DROP POLICY IF EXISTS "Allow authenticated users to update bouts" ON public.bouts;
DROP POLICY IF EXISTS "Allow authenticated users to delete bouts" ON public.bouts;

CREATE POLICY "Allow authenticated users to view bouts" ON public.bouts
    FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert bouts" ON public.bouts
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update bouts" ON public.bouts
    FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete bouts" ON public.bouts
    FOR DELETE USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix player_stats table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view player_stats" ON public.player_stats;
DROP POLICY IF EXISTS "Allow authenticated users to insert player_stats" ON public.player_stats;
DROP POLICY IF EXISTS "Allow authenticated users to update player_stats" ON public.player_stats;
DROP POLICY IF EXISTS "Allow authenticated users to delete player_stats" ON public.player_stats;

CREATE POLICY "Allow authenticated users to view player_stats" ON public.player_stats
    FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert player_stats" ON public.player_stats
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to update player_stats" ON public.player_stats
    FOR UPDATE USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete player_stats" ON public.player_stats
    FOR DELETE USING ((SELECT auth.uid()) IS NOT NULL);

-- Note: These fixes wrap auth.uid() in (SELECT auth.uid()) subqueries
-- This ensures the authentication check is evaluated once per query instead of once per row
-- This dramatically improves performance for queries that return multiple rows

-- =============================================================================
-- FOREIGN KEY INDEX PERFORMANCE FIXES
-- =============================================================================
-- These indexes improve performance for foreign key lookups and joins

-- Index for bouts.home_team_id foreign key
-- Improves performance when querying bouts by home team
CREATE INDEX IF NOT EXISTS idx_bouts_home_team_id ON public.bouts(home_team_id);

-- Index for bouts.away_team_id foreign key  
-- Improves performance when querying bouts by away team
CREATE INDEX IF NOT EXISTS idx_bouts_away_team_id ON public.bouts(away_team_id);

-- Index for player_stats.bout_id foreign key
-- Improves performance when querying player stats by bout
-- This is particularly important for live stat tracking
CREATE INDEX IF NOT EXISTS idx_player_stats_bout_id ON public.player_stats(bout_id);

-- Index for player_teams.team_id foreign key
-- Improves performance when querying player-team relationships by team
-- This is important for loading team rosters
CREATE INDEX IF NOT EXISTS idx_player_teams_team_id ON public.player_teams(team_id);

-- Composite index for player_stats (bout_id, player_id)
-- Optimizes the common query pattern of getting specific player stats for a bout
CREATE INDEX IF NOT EXISTS idx_player_stats_bout_player ON public.player_stats(bout_id, player_id);

-- Composite index for player_teams (team_id, is_active)
-- Optimizes loading active players for a team (common in live tracking)
CREATE INDEX IF NOT EXISTS idx_player_teams_team_active ON public.player_teams(team_id, is_active);

-- Note: These indexes will significantly improve query performance for:
-- 1. Loading bout details with team information
-- 2. Fetching player stats for a specific bout (live tracking)
-- 3. Getting team rosters and active players
-- 4. Joining tables on foreign key relationships