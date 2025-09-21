-- Profile Ownership & Privacy System Migration
-- This migration adds device-based ownership and privacy controls to profiles

-- 1. Add ownership and privacy fields to existing profiles table
ALTER TABLE profiles
ADD COLUMN device_id TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN created_by_device TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create device_profiles table for tracking device access to profiles
CREATE TABLE device_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_owner BOOLEAN DEFAULT true,
    access_type TEXT DEFAULT 'owned' CHECK (access_type IN ('owned', 'shared', 'recent')),
    shared_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_device_profile UNIQUE (device_id, profile_id)
);

-- 3. Create share_permissions table for managing profile sharing
CREATE TABLE share_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    share_code TEXT UNIQUE NOT NULL,
    share_type TEXT DEFAULT 'temporary' CHECK (share_type IN ('temporary', 'permanent', 'game_session')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_count INTEGER DEFAULT 0,
    max_uses INTEGER, -- NULL = unlimited uses
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT valid_expiration CHECK (
        (share_type = 'temporary' AND expires_at IS NOT NULL) OR
        (share_type IN ('permanent', 'game_session') AND expires_at IS NULL)
    )
);

-- 4. Create indexes for performance
CREATE INDEX idx_profiles_device_id ON profiles(device_id);
CREATE INDEX idx_profiles_is_public ON profiles(is_public);
CREATE INDEX idx_device_profiles_device_id ON device_profiles(device_id);
CREATE INDEX idx_device_profiles_profile_id ON device_profiles(profile_id);
CREATE INDEX idx_device_profiles_access_type ON device_profiles(access_type);
CREATE INDEX idx_device_profiles_last_used ON device_profiles(last_used DESC);
CREATE INDEX idx_share_permissions_share_code ON share_permissions(share_code);
CREATE INDEX idx_share_permissions_profile_id ON share_permissions(profile_id);
CREATE INDEX idx_share_permissions_expires_at ON share_permissions(expires_at);
CREATE INDEX idx_share_permissions_active ON share_permissions(is_active) WHERE is_active = true;

-- 5. Enable Row Level Security on new tables
ALTER TABLE device_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_permissions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for device_profiles
CREATE POLICY "Users can view their device profiles" ON device_profiles
    FOR SELECT USING (true); -- Allow all for now, can be restricted later

CREATE POLICY "Users can insert their device profiles" ON device_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their device profiles" ON device_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their device profiles" ON device_profiles
    FOR DELETE USING (true);

-- 7. Create RLS policies for share_permissions
CREATE POLICY "Users can view share permissions" ON share_permissions
    FOR SELECT USING (true);

CREATE POLICY "Users can create share permissions" ON share_permissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update share permissions" ON share_permissions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete share permissions" ON share_permissions
    FOR DELETE USING (true);

-- 8. Create function to clean up expired share codes
CREATE OR REPLACE FUNCTION cleanup_expired_share_codes()
RETURNS void AS $$
BEGIN
    -- Mark expired temporary shares as inactive
    UPDATE share_permissions
    SET is_active = false
    WHERE share_type = 'temporary'
      AND expires_at < NOW()
      AND is_active = true;

    -- Log the cleanup
    RAISE NOTICE 'Cleaned up expired share codes at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_unique_share_code()
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
        IF NOT EXISTS (SELECT 1 FROM share_permissions WHERE share_code = new_code) THEN
            RETURN new_code;
        END IF;

        attempts := attempts + 1;
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique share code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-generate share codes on insert
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
        NEW.share_code := generate_unique_share_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_share_code
    BEFORE INSERT ON share_permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_share_code();

-- 11. Create view for profile access summary
CREATE VIEW profile_access_summary AS
SELECT
    p.id as profile_id,
    p.username,
    p.display_name,
    p.device_id as owner_device_id,
    p.is_public,
    COUNT(DISTINCT dp.device_id) as device_count,
    COUNT(DISTINCT CASE WHEN dp.access_type = 'shared' THEN dp.device_id END) as shared_device_count,
    COUNT(DISTINCT sp.id) as active_share_codes,
    MAX(dp.last_used) as last_used_anywhere
FROM profiles p
LEFT JOIN device_profiles dp ON p.id = dp.profile_id
LEFT JOIN share_permissions sp ON p.id = sp.profile_id AND sp.is_active = true
GROUP BY p.id, p.username, p.display_name, p.device_id, p.is_public;

-- 12. Make existing profiles public by default for backward compatibility
UPDATE profiles SET is_public = true WHERE device_id IS NULL;

-- 13. Create helpful comments
COMMENT ON TABLE device_profiles IS 'Tracks which devices have access to which profiles and how they gained access';
COMMENT ON TABLE share_permissions IS 'Manages temporary and permanent sharing of profiles via share codes';
COMMENT ON COLUMN profiles.device_id IS 'ID of the device that created this profile';
COMMENT ON COLUMN profiles.is_public IS 'Whether this profile is visible to all users';
COMMENT ON COLUMN device_profiles.access_type IS 'How this device gained access: owned, shared, or recent';
COMMENT ON COLUMN share_permissions.share_type IS 'Type of sharing: temporary (expires), permanent, or game_session';
COMMENT ON FUNCTION cleanup_expired_share_codes() IS 'Utility function to mark expired share codes as inactive';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Profile Ownership System migration completed successfully!';
    RAISE NOTICE 'Added device ownership, privacy controls, and share code system.';
END $$;