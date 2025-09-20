-- Profile System Migration
-- This migration updates the existing profile system to include share codes and better stats tracking

-- 1. Drop existing tables if we need to recreate them with new schema
-- (We'll preserve data first if any exists)

-- Create temporary backup tables if data exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games_new') THEN
        CREATE TABLE IF NOT EXISTS games_backup AS SELECT * FROM games_new;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_participants') THEN
        CREATE TABLE IF NOT EXISTS game_participants_backup AS SELECT * FROM game_participants;
    END IF;
END $$;

-- 2. Drop existing tables to recreate with new schema
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games_new CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 3. Create new profiles table with share code system
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    share_code TEXT UNIQUE NOT NULL,
    primary_commander TEXT,
    color_identity TEXT,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Additional fields for enhanced functionality
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Stats cache for quick access
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_game_duration INTEGER DEFAULT 0,
    favorite_colors TEXT[],

    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
    CONSTRAINT share_code_format CHECK (share_code ~ '^[A-Z]{3}[0-9]{3}$')
);

-- 4. Create games table (modified from existing)
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

-- 5. Create game_players junction table
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

-- 6. Create indexes for performance
CREATE INDEX idx_profiles_share_code ON profiles(share_code);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_winner ON games(winner_profile_id);
CREATE INDEX idx_game_players_profile ON game_players(profile_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_placement ON game_players(placement);

-- 7. Create function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    consonants TEXT[] := ARRAY['B','C','D','F','G','H','J','K','L','M','N','P','R','S','T','V','W','X','Y','Z'];
    new_code TEXT;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate random code: 3 consonants + 3 numbers
        new_code := consonants[floor(random() * array_length(consonants, 1) + 1)]::TEXT ||
                   consonants[floor(random() * array_length(consonants, 1) + 1)]::TEXT ||
                   consonants[floor(random() * array_length(consonants, 1) + 1)]::TEXT ||
                   lpad(floor(random() * 1000)::TEXT, 3, '0');

        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE share_code = new_code) THEN
            RETURN new_code;
        END IF;

        attempts := attempts + 1;
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique share code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-generate share code on insert
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
        NEW.share_code := generate_share_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_share_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_share_code();

-- 9. Create function to update profile stats after game
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_id UUID;
    v_total_games INTEGER;
    v_total_wins INTEGER;
    v_win_rate DECIMAL(5,2);
    v_avg_duration INTEGER;
BEGIN
    -- Get profile_id from the trigger context
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_profile_id := NEW.profile_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_profile_id := OLD.profile_id;
    END IF;

    -- Skip if guest player
    IF v_profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate stats
    SELECT
        COUNT(*),
        COUNT(CASE WHEN placement = 1 THEN 1 END),
        CASE
            WHEN COUNT(*) > 0
            THEN ROUND(COUNT(CASE WHEN placement = 1 THEN 1 END)::DECIMAL / COUNT(*) * 100, 2)
            ELSE 0.00
        END,
        ROUND(AVG(g.duration_minutes))
    INTO v_total_games, v_total_wins, v_win_rate, v_avg_duration
    FROM game_players gp
    JOIN games g ON gp.game_id = g.id
    WHERE gp.profile_id = v_profile_id;

    -- Update profile
    UPDATE profiles
    SET
        games_played = COALESCE(v_total_games, 0),
        wins = COALESCE(v_total_wins, 0),
        win_rate = COALESCE(v_win_rate, 0.00),
        avg_game_duration = COALESCE(v_avg_duration, 0),
        updated_at = NOW(),
        last_seen = NOW()
    WHERE id = v_profile_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for stats updates
CREATE TRIGGER trigger_update_stats_on_game_player
AFTER INSERT OR UPDATE OR DELETE ON game_players
FOR EACH ROW
EXECUTE FUNCTION update_profile_stats();

-- 11. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 12. Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read profiles (for share codes)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Allow users to create their own profiles
CREATE POLICY "Users can create profiles" ON profiles
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own profiles (needs auth implementation)
CREATE POLICY "Users can update own profiles" ON profiles
    FOR UPDATE USING (true);

-- Games policies
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create games" ON games
    FOR INSERT WITH CHECK (true);

-- Game players policies
CREATE POLICY "Game players are viewable by everyone" ON game_players
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create game players" ON game_players
    FOR INSERT WITH CHECK (true);

-- 13. Migrate existing data if backups exist
DO $$
BEGIN
    -- Migrate user_profiles to profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles_backup') THEN
        INSERT INTO profiles (id, username, display_name, created_at, updated_at)
        SELECT
            id,
            COALESCE(username, 'user_' || substr(id::text, 1, 8)),
            display_name,
            created_at,
            updated_at
        FROM user_profiles_backup
        ON CONFLICT (username) DO NOTHING;
    END IF;

    -- Migrate games_new to games
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games_backup') THEN
        INSERT INTO games (id, winner_profile_id, player_count, duration_minutes, total_turns, created_at)
        SELECT
            id,
            winner_profile_id,
            player_count,
            ROUND(duration_seconds::DECIMAL / 60),
            total_turns,
            created_at
        FROM games_backup;
    END IF;

    -- Migrate game_participants to game_players
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_participants_backup') THEN
        INSERT INTO game_players (
            game_id,
            profile_id,
            player_position,
            is_guest,
            guest_name,
            starting_life,
            final_life,
            placement,
            commander_name,
            commander_colors
        )
        SELECT
            game_id,
            profile_id,
            COALESCE(player_position, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY created_at)),
            CASE WHEN profile_id IS NULL THEN true ELSE false END,
            CASE WHEN profile_id IS NULL THEN COALESCE(player_name, 'Guest') ELSE NULL END,
            starting_life,
            final_life,
            place,
            commander,
            colors
        FROM game_participants_backup;
    END IF;

    -- Drop backup tables
    DROP TABLE IF EXISTS user_profiles_backup;
    DROP TABLE IF EXISTS games_backup;
    DROP TABLE IF EXISTS game_participants_backup;
END $$;

-- 14. Create view for easy stats access
CREATE OR REPLACE VIEW profile_stats_view AS
SELECT
    p.*,
    COUNT(DISTINCT gp.game_id) as total_games_calc,
    COUNT(DISTINCT CASE WHEN gp.placement = 1 THEN gp.game_id END) as wins_calc,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT gp.game_id) > 0
            THEN COUNT(DISTINCT CASE WHEN gp.placement = 1 THEN gp.game_id END)::DECIMAL / COUNT(DISTINCT gp.game_id) * 100
            ELSE 0
        END, 2
    ) as win_rate_calc,
    array_agg(DISTINCT gp.commander_name) FILTER (WHERE gp.commander_name IS NOT NULL) as commanders_played,
    array_agg(DISTINCT unnest(gp.commander_colors)) FILTER (WHERE gp.commander_colors IS NOT NULL) as colors_played
FROM profiles p
LEFT JOIN game_players gp ON p.id = gp.profile_id
GROUP BY p.id;

-- 15. Sample data for testing (optional - comment out in production)
-- INSERT INTO profiles (username, display_name, primary_commander)
-- VALUES
--     ('testuser1', 'Test Player 1', 'Atraxa, Praetors'' Voice'),
--     ('testuser2', 'Test Player 2', 'Edgar Markov'),
--     ('testuser3', 'Test Player 3', 'The Ur-Dragon');

COMMENT ON TABLE profiles IS 'Player profiles with share codes for cross-device syncing';
COMMENT ON TABLE games IS 'Game sessions with winner and metadata';
COMMENT ON TABLE game_players IS 'Individual player performance in each game';
COMMENT ON FUNCTION generate_share_code IS 'Generates unique 6-character share codes (3 letters + 3 numbers)';