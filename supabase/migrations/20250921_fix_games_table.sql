-- Fix games table constraint issue
-- This migration fixes the format constraint violation by ensuring the correct games table structure

-- 1. Backup existing games table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games') THEN
        -- Only create backup if it doesn't already exist
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games_backup_fix') THEN
            CREATE TABLE games_backup_fix AS SELECT * FROM games;
        END IF;
    END IF;
END $$;

-- 2. Drop and recreate games table with correct constraints
DROP TABLE IF EXISTS games CASCADE;

-- 3. Create games table with correct format constraint
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    winner_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    player_count INTEGER NOT NULL CHECK (player_count >= 1 AND player_count <= 6),
    duration_minutes INTEGER,
    format TEXT DEFAULT 'commander' CHECK (format IN ('commander', 'brawl', 'planechase', 'archenemy', 'two-headed-giant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Additional metadata
    total_turns INTEGER,
    first_blood_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    is_ranked BOOLEAN DEFAULT false
);

-- 4. Recreate indexes
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_winner ON games(winner_profile_id);

-- 5. Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 6. Create policies (allow all for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON games FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON games FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON games FOR DELETE USING (true);