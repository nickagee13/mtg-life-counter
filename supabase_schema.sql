-- MTG Life Counter Enhanced Database Schema
-- This file documents the required Supabase tables for user profiles and game stats

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stats JSONB DEFAULT '{}'::jsonb
);

-- Enhanced Games Table
CREATE TABLE IF NOT EXISTS games_new (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_turns INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    winner_profile_id UUID REFERENCES user_profiles(id),
    game_format TEXT DEFAULT 'Commander',
    player_count INTEGER NOT NULL,
    commander_damage JSONB DEFAULT '{}'::jsonb
);

-- Game Participants Table
CREATE TABLE IF NOT EXISTS game_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games_new(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES user_profiles(id),
    player_name TEXT NOT NULL,
    commander TEXT,
    colors TEXT[] DEFAULT '{}',
    starting_life INTEGER DEFAULT 40,
    final_life INTEGER NOT NULL,
    place INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
    eliminated_turn INTEGER,
    commander_damage_dealt JSONB DEFAULT '{}'::jsonb,
    commander_damage_received JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_winner ON games_new(winner_profile_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games_new(created_at);
CREATE INDEX IF NOT EXISTS idx_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_participants_profile_id ON game_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_participants_place ON game_participants(place);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Allow public read access for user profiles (for game sharing)
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (true);

-- Allow users to insert their own profiles
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Allow public read access for games and participants
CREATE POLICY "Games are viewable by everyone" ON games_new
    FOR SELECT USING (true);

CREATE POLICY "Game participants are viewable by everyone" ON game_participants
    FOR SELECT USING (true);

-- Allow anyone to insert games and participants (for now)
CREATE POLICY "Anyone can insert games" ON games_new
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert participants" ON game_participants
    FOR INSERT WITH CHECK (true);

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for all participants in the game
    UPDATE user_profiles
    SET stats = COALESCE(stats, '{}'::jsonb) || jsonb_build_object(
        'total_games', COALESCE((stats->>'total_games')::int, 0) + 1,
        'wins', COALESCE((stats->>'wins')::int, 0) + CASE WHEN NEW.place = 1 THEN 1 ELSE 0 END,
        'last_game_date', NEW.created_at
    )
    WHERE id = NEW.profile_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON game_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();