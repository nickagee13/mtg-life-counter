/**
 * Profile Ownership Service
 * Manages device-based profile ownership and access control
 */

import { supabase } from '../supabase';
import { getDeviceId, storeDeviceMetadata } from '../device/deviceId';

/**
 * Creates a new profile with device ownership
 * @param {Object} profileData Profile data (username, display_name, etc.)
 * @param {Object} options Creation options
 * @returns {Promise<Object>} Created profile with ownership info
 */
export async function createOwnedProfile(profileData, options = {}) {
    const deviceId = getDeviceId();
    const { isPublic = false } = options;

    try {
        // Create profile with device ownership
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
                ...profileData,
                device_id: deviceId,
                is_public: isPublic,
                created_by_device: new Date().toISOString()
            })
            .select()
            .single();

        if (profileError) throw profileError;

        // Track local ownership
        const { error: deviceProfileError } = await supabase
            .from('device_profiles')
            .insert({
                device_id: deviceId,
                profile_id: profile.id,
                is_owner: true,
                access_type: 'owned',
                last_used: new Date().toISOString()
            });

        if (deviceProfileError) {
            console.warn('Could not track device ownership:', deviceProfileError);
        }

        // Store device metadata for analytics
        storeDeviceMetadata({ profilesCreated: 1 });

        console.log('✅ Created owned profile:', profile.username);
        return profile;

    } catch (error) {
        console.error('❌ Error creating owned profile:', error);
        throw error;
    }
}

/**
 * Gets all profiles owned by this device
 * @returns {Promise<Array>} Array of owned profiles
 */
export async function getMyProfiles() {
    const deviceId = getDeviceId();

    try {
        const { data, error } = await supabase
            .from('device_profiles')
            .select(`
                profile_id,
                last_used,
                profiles (
                    id,
                    username,
                    display_name,
                    share_code,
                    is_public,
                    games_played,
                    wins,
                    win_rate,
                    created_at
                )
            `)
            .eq('device_id', deviceId)
            .eq('access_type', 'owned')
            .order('last_used', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            ...item.profiles,
            lastUsed: item.last_used,
            isOwned: true
        }));

    } catch (error) {
        console.error('❌ Error fetching owned profiles:', error);
        return [];
    }
}

/**
 * Gets all profiles accessible to this device (owned + shared + public)
 * @returns {Promise<Object>} Categorized profiles
 */
export async function getAccessibleProfiles() {
    const deviceId = getDeviceId();

    try {
        // Get device-specific profiles (owned + shared + recent)
        const { data: deviceProfiles, error: deviceError } = await supabase
            .from('device_profiles')
            .select(`
                access_type,
                shared_at,
                last_used,
                profiles (
                    id,
                    username,
                    display_name,
                    share_code,
                    is_public,
                    games_played,
                    wins,
                    win_rate,
                    created_at
                )
            `)
            .eq('device_id', deviceId)
            .order('last_used', { ascending: false });

        if (deviceError) throw deviceError;

        // Get public profiles (not owned by this device)
        const { data: publicProfiles, error: publicError } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_public', true)
            .neq('device_id', deviceId);

        if (publicError) throw publicError;

        // Categorize profiles
        const categorized = {
            owned: [],
            shared: [],
            recent: [],
            public: publicProfiles || []
        };

        deviceProfiles?.forEach(item => {
            const profile = {
                ...item.profiles,
                lastUsed: item.last_used,
                sharedAt: item.shared_at
            };

            switch (item.access_type) {
                case 'owned':
                    categorized.owned.push({ ...profile, isOwned: true });
                    break;
                case 'shared':
                    categorized.shared.push({ ...profile, isShared: true });
                    break;
                case 'recent':
                    categorized.recent.push({ ...profile, isRecent: true });
                    break;
            }
        });

        return categorized;

    } catch (error) {
        console.error('❌ Error fetching accessible profiles:', error);
        return { owned: [], shared: [], recent: [], public: [] };
    }
}

/**
 * Updates profile privacy setting
 * @param {string} profileId Profile ID
 * @param {boolean} isPublic Whether profile should be public
 * @returns {Promise<boolean>} Success status
 */
export async function updateProfilePrivacy(profileId, isPublic) {
    const deviceId = getDeviceId();

    try {
        // Verify ownership before updating
        const { data: ownership, error: ownershipError } = await supabase
            .from('profiles')
            .select('device_id')
            .eq('id', profileId)
            .single();

        if (ownershipError) throw ownershipError;

        if (ownership.device_id !== deviceId) {
            throw new Error('Cannot modify profile privacy: not the owner');
        }

        // Update privacy setting
        const { error } = await supabase
            .from('profiles')
            .update({ is_public: isPublic })
            .eq('id', profileId);

        if (error) throw error;

        console.log(`✅ Updated profile privacy: ${isPublic ? 'public' : 'private'}`);
        return true;

    } catch (error) {
        console.error('❌ Error updating profile privacy:', error);
        throw error;
    }
}

/**
 * Tracks profile usage for this device
 * @param {string} profileId Profile ID that was used
 * @param {string} accessType Type of access ('owned', 'shared', 'recent')
 */
export async function trackProfileUsage(profileId, accessType = 'recent') {
    const deviceId = getDeviceId();

    try {
        // Update or insert device_profiles record
        const { error } = await supabase
            .from('device_profiles')
            .upsert({
                device_id: deviceId,
                profile_id: profileId,
                access_type: accessType,
                last_used: new Date().toISOString()
            }, {
                onConflict: 'device_id,profile_id'
            });

        if (error) {
            console.warn('Could not track profile usage:', error);
        }

    } catch (error) {
        console.warn('Could not track profile usage:', error);
    }
}

/**
 * Checks if this device owns a specific profile
 * @param {string} profileId Profile ID to check
 * @returns {Promise<boolean>} True if device owns the profile
 */
export async function isProfileOwner(profileId) {
    const deviceId = getDeviceId();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('device_id')
            .eq('id', profileId)
            .single();

        if (error) return false;
        return data.device_id === deviceId;

    } catch (error) {
        console.warn('Could not check profile ownership:', error);
        return false;
    }
}

/**
 * Gets ownership statistics for this device
 * @returns {Promise<Object>} Ownership statistics
 */
export async function getOwnershipStats() {
    const deviceId = getDeviceId();

    try {
        const { data, error } = await supabase
            .from('device_profiles')
            .select('access_type')
            .eq('device_id', deviceId);

        if (error) throw error;

        const stats = {
            owned: 0,
            shared: 0,
            recent: 0,
            total: data.length
        };

        data.forEach(item => {
            stats[item.access_type]++;
        });

        return stats;

    } catch (error) {
        console.error('❌ Error getting ownership stats:', error);
        return { owned: 0, shared: 0, recent: 0, total: 0 };
    }
}

/**
 * Removes access to a profile for this device
 * @param {string} profileId Profile ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeProfileAccess(profileId) {
    const deviceId = getDeviceId();

    try {
        // Check if we own this profile (can't remove ownership)
        const isOwner = await isProfileOwner(profileId);
        if (isOwner) {
            throw new Error('Cannot remove access to owned profile');
        }

        const { error } = await supabase
            .from('device_profiles')
            .delete()
            .eq('device_id', deviceId)
            .eq('profile_id', profileId);

        if (error) throw error;

        console.log('✅ Removed profile access');
        return true;

    } catch (error) {
        console.error('❌ Error removing profile access:', error);
        throw error;
    }
}

/**
 * Fixes legacy profiles to work with the ownership system
 * @param {string} profileId Profile ID to fix
 * @returns {Promise<boolean>} Success status
 */
export async function fixLegacyProfile(profileId) {
    const deviceId = getDeviceId();

    try {
        console.log('🔧 Fixing legacy profile:', profileId);

        // Update the profile to have current device_id
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ device_id: deviceId })
            .eq('id', profileId);

        if (updateError) throw updateError;

        // Create device_profiles relationship
        const { error: deviceProfileError } = await supabase
            .from('device_profiles')
            .upsert({
                device_id: deviceId,
                profile_id: profileId,
                is_owner: true,
                access_type: 'owned',
                last_used: new Date().toISOString()
            }, {
                onConflict: 'device_id,profile_id'
            });

        if (deviceProfileError) throw deviceProfileError;

        console.log('✅ Legacy profile fixed');
        return true;

    } catch (error) {
        console.error('❌ Error fixing legacy profile:', error);
        throw error;
    }
}

/**
 * Deletes a profile owned by this device
 * @param {string} profileId Profile ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteOwnedProfile(profileId) {
    const deviceId = getDeviceId();

    try {
        // Verify ownership before deleting
        const isOwner = await isProfileOwner(profileId);
        if (!isOwner) {
            throw new Error('Cannot delete profile: not the owner');
        }

        console.log('🔍 Deleting profile with:', { profileId, deviceId });

        // First, let's check what the profile's device_id actually is
        const { data: profileCheck, error: checkError } = await supabase
            .from('profiles')
            .select('id, username, device_id')
            .eq('id', profileId)
            .single();

        if (checkError) throw checkError;
        console.log('🔍 Profile to delete:', profileCheck);

        // Check for related records that might prevent deletion
        const { data: relatedRecords, error: relatedError } = await supabase
            .from('device_profiles')
            .select('*')
            .eq('profile_id', profileId);

        if (relatedError) {
            console.warn('Could not check device_profiles:', relatedError);
        } else {
            console.log('🔍 Related device_profiles records:', relatedRecords);
        }

        // Try deleting device_profiles first (manual CASCADE)
        if (relatedRecords && relatedRecords.length > 0) {
            console.log('🧹 Cleaning up device_profiles records first...');
            const { error: cleanupError } = await supabase
                .from('device_profiles')
                .delete()
                .eq('profile_id', profileId);

            if (cleanupError) {
                console.warn('Could not cleanup device_profiles:', cleanupError);
            } else {
                console.log('✅ Device_profiles records cleaned up');
            }
        }

        // Use the database function to handle deletion with proper RLS context
        console.log('🔄 Using database function for deletion...');
        const { data, error } = await supabase.rpc('delete_profile_with_device_context', {
            profile_id_param: profileId,
            device_id_param: deviceId
        });

        console.log('🔍 Database function result:', { data, error, success: data });

        if (error) throw error;

        if (!data) {
            throw new Error('Profile deletion failed - database function returned false');
        }

        console.log('✅ Profile deleted successfully');
        return true;

    } catch (error) {
        console.error('❌ Error deleting profile:', error);
        throw error;
    }
}