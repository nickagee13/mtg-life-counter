-- Fix Row Level Security for profile deletion
-- This migration adds proper RLS policies for profile deletion

-- First, let's check existing policies
-- DROP POLICY IF EXISTS "Users can delete their own profiles" ON profiles;

-- Create a proper delete policy for profiles
CREATE POLICY "Users can delete owned profiles" ON profiles
FOR DELETE
USING (device_id = current_setting('app.device_id', true));

-- Create a function to handle profile deletion with proper context
CREATE OR REPLACE FUNCTION delete_profile_with_device_context(
  profile_id_param UUID,
  device_id_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the device_id context for RLS
  PERFORM set_config('app.device_id', device_id_param, true);

  -- Delete device_profiles first
  DELETE FROM device_profiles
  WHERE profile_id = profile_id_param;

  -- Delete the profile
  DELETE FROM profiles
  WHERE id = profile_id_param AND device_id = device_id_param;

  -- Check if deletion was successful
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_profile_with_device_context TO authenticated;
GRANT EXECUTE ON FUNCTION delete_profile_with_device_context TO anon;