-- Derby Stat Tracker Database Schema
-- Run this in your Supabase SQL editor to set up the initial database structure

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Team name should be unique across all teams
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    derby_name VARCHAR(100) NOT NULL UNIQUE, -- Derby name should be unique across all players
    preferred_number VARCHAR(10) NOT NULL, -- Their usual/preferred number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_teams junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS player_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    number VARCHAR(10) NOT NULL, -- Actual number worn on this team (usually same as preferred_number)
    position VARCHAR(20) CHECK (position IN ('jammer', 'blocker', 'pivot')) DEFAULT 'blocker',
    is_active BOOLEAN DEFAULT true, -- Whether the player is currently active on this team
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(number, team_id), -- Ensure unique numbers within a team
    UNIQUE(player_id, team_id) -- Prevent duplicate player-team relationships
);

-- Create bouts table
CREATE TABLE IF NOT EXISTS bouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    bout_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(200) NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    bout_id UUID REFERENCES bouts(id) ON DELETE CASCADE,
    jams_played INTEGER DEFAULT 0,
    lead_jammer INTEGER DEFAULT 0,
    points_scored INTEGER DEFAULT 0,
    penalties INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, bout_id) -- One stat record per player per bout
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_teams_updated_at BEFORE UPDATE ON player_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bouts_updated_at BEFORE UPDATE ON bouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for now, allow authenticated users to do everything)
-- You can make these more restrictive based on your needs

CREATE POLICY "Allow authenticated users to view teams" ON teams
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert teams" ON teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update teams" ON teams
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete teams" ON teams
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view players" ON players
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert players" ON players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update players" ON players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete players" ON players
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view player_teams" ON player_teams
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert player_teams" ON player_teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update player_teams" ON player_teams
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete player_teams" ON player_teams
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view bouts" ON bouts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert bouts" ON bouts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update bouts" ON bouts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete bouts" ON bouts
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view player_stats" ON player_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert player_stats" ON player_stats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update player_stats" ON player_stats
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete player_stats" ON player_stats
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO teams (name) VALUES 
    ('Bells of the Brawl'),
    ('Daisy Pushers'),
    ('Margarita Villains'),
    ('The Hard Cores');

-- Insert sample players with their preferred numbers
INSERT INTO players (derby_name, preferred_number) VALUES 
    ('Lylability', '404'),
    ('Green Bean', '23'),
    ('Dita Von Terror', '321');

-- Now assign players to teams - they'll use their preferred number unless it's taken
INSERT INTO player_teams (player_id, team_id, number, position) VALUES 
    ((SELECT id FROM players WHERE derby_name = 'Lylability'), (SELECT id FROM teams WHERE name = 'Bells of the Brawl'), '404', 'pivot'),
    ((SELECT id FROM players WHERE derby_name = 'Green Bean'), (SELECT id FROM teams WHERE name = 'Daisy Pushers'), '23', 'jammer'),
    ((SELECT id FROM players WHERE derby_name = 'Dita Von Terror'), (SELECT id FROM teams WHERE name = 'Margarita Villains'), '321', 'blocker');

-- Example: Player can use same number on multiple teams (most common scenario)
INSERT INTO player_teams (player_id, team_id, number, position) VALUES 
    ((SELECT id FROM players WHERE derby_name = 'Lylability'), (SELECT id FROM teams WHERE name = 'The Hard Cores'), '404', 'pivot');

-- Example: Player forced to use different number on travel team because their preferred number is taken
-- INSERT INTO player_teams (player_id, team_id, number, position) VALUES 
--     ((SELECT id FROM players WHERE derby_name = 'Lylability'), (SELECT id FROM teams WHERE name = 'Some Travel Team'), '99', 'jammer');