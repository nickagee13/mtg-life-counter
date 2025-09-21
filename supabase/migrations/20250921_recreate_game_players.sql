-- Recreate game_players table with proper foreign key relationship
-- This migration recreates the game_players table that was dropped when games was recreated

-- 1. Drop game_players table if it exists (may be orphaned)
DROP TABLE IF EXISTS game_players CASCADE;

-- 2. Recreate game_players table with proper foreign key to games
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    player_position INTEGER NOT NULL CHECK (player_position >= 1 AND player_position <= 6),
    is_guest BOOLEAN DEFAULT false,
    guest_name TEXT,
    starting_life INTEGER DEFAULT 40,
    final_life INTEGER,
    commander_damage_dealt INTEGER DEFAULT 0,
    commander_damage_received JSONB DEFAULT '{}',
    placement INTEGER CHECK (placement >= 1 AND placement <= 6),

    -- Commander information
    commander_name TEXT,
    commander_colors TEXT[],
    partner_commander TEXT,

    -- Performance metrics
    turns_survived INTEGER,
    eliminations INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT guest_or_profile CHECK (
        (is_guest = true AND guest_name IS NOT NULL) OR
        (is_guest = false AND profile_id IS NOT NULL)
    ),
    CONSTRAINT unique_player_per_game UNIQUE (game_id, player_position)
);

-- 3. Create indexes for performance
CREATE INDEX idx_game_players_profile ON game_players(profile_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_placement ON game_players(placement);

-- 4. Enable Row Level Security
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (allow all for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON game_players FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON game_players FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON game_players FOR DELETE USING (true);