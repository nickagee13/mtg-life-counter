/**
 * Profile Share Code System
 * Manages temporary and permanent sharing of profiles via codes
 */

import { supabase } from '../supabase';
import { getDeviceId } from '../device/deviceId';
import { trackProfileUsage, isProfileOwner } from './profileOwnership';

/**
 * Generates a share code for a profile
 * @param {string} profileId Profile to share
 * @param {Object} options Share options
 * @returns {Promise<Object>} Share permission object with code
 */
export async function shareProfile(profileId, options = {}) {
    const {
        shareType = 'temporary',
        expiresInHours = 24,
        maxUses = null,
        description = null
    } = options;

    // Verify ownership
    const isOwner = await isProfileOwner(profileId);
    if (!isOwner) {
        throw new Error('Only profile owners can create share codes');
    }

    try {
        // Calculate expiration if temporary
        const expiresAt = shareType === 'temporary'
            ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
            : null;

        // Create share permission
        const { data: sharePermission, error } = await supabase
            .from('share_permissions')
            .insert({
                profile_id: profileId,
                share_type: shareType,
                expires_at: expiresAt,
                max_uses: maxUses,
                is_active: true
            })
            .select(`
                *,
                profiles (
                    username,
                    display_name
                )
            `)
            .single();

        if (error) throw error;

        console.log(`✅ Created ${shareType} share code:`, sharePermission.share_code);
        return sharePermission;

    } catch (error) {
        console.error('❌ Error creating share code:', error);
        throw error;
    }
}

/**
 * Uses a share code to gain access to a profile
 * @param {string} shareCode Share code to redeem
 * @returns {Promise<Object>} Profile that was shared
 */
export async function useShareCode(shareCode) {
    const deviceId = getDeviceId();

    try {
        // Find and validate share permission
        const { data: permission, error: permissionError } = await supabase
            .from('share_permissions')
            .select(`
                *,
                profiles (*)
            `)
            .eq('share_code', shareCode.toUpperCase())
            .eq('is_active', true)
            .single();

        if (permissionError || !permission) {
            throw new Error('Invalid or inactive share code');
        }

        // Check if code has expired
        if (permission.expires_at && new Date(permission.expires_at) < new Date()) {
            // Mark as inactive
            await supabase
                .from('share_permissions')
                .update({ is_active: false })
                .eq('id', permission.id);

            throw new Error('Share code has expired');
        }

        // Check usage limit
        if (permission.max_uses && permission.used_count >= permission.max_uses) {
            await supabase
                .from('share_permissions')
                .update({ is_active: false })
                .eq('id', permission.id);

            throw new Error('Share code has reached maximum uses');
        }

        // Check if we already have access to this profile
        const { data: existingAccess } = await supabase
            .from('device_profiles')
            .select('access_type')
            .eq('device_id', deviceId)
            .eq('profile_id', permission.profile_id)
            .single();

        let accessType = 'shared';

        // If we already own this profile, just track usage
        if (existingAccess?.access_type === 'owned') {
            accessType = 'owned';
        }

        // Grant access to device
        await supabase
            .from('device_profiles')
            .upsert({
                device_id: deviceId,
                profile_id: permission.profile_id,
                is_owner: accessType === 'owned',
                access_type: accessType,
                shared_at: accessType === 'shared' ? new Date().toISOString() : null,
                last_used: new Date().toISOString()
            }, {
                onConflict: 'device_id,profile_id'
            });

        // Increment usage count
        await supabase
            .from('share_permissions')
            .update({
                used_count: permission.used_count + 1,
                // Deactivate game_session shares after first use
                is_active: permission.share_type === 'game_session' ? false : true
            })
            .eq('id', permission.id);

        console.log(`✅ Used share code for profile: ${permission.profiles.username}`);
        return {
            ...permission.profiles,
            shareType: permission.share_type,
            sharedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Error using share code:', error);
        throw error;
    }
}

/**
 * Gets all active share codes for profiles owned by this device
 * @returns {Promise<Array>} Array of share permissions
 */
export async function getMyShareCodes() {
    const deviceId = getDeviceId();

    try {
        const { data, error } = await supabase
            .from('share_permissions')
            .select(`
                *,
                profiles!inner (
                    username,
                    display_name,
                    device_id
                )
            `)
            .eq('profiles.device_id', deviceId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(permission => ({
            ...permission,
            isExpired: permission.expires_at && new Date(permission.expires_at) < new Date(),
            usageRemaining: permission.max_uses ? permission.max_uses - permission.used_count : null,
            timeRemaining: permission.expires_at
                ? Math.max(0, new Date(permission.expires_at) - new Date())
                : null
        }));

    } catch (error) {
        console.error('❌ Error fetching share codes:', error);
        return [];
    }
}

/**
 * Deactivates a share code
 * @param {string} shareCodeId Share permission ID
 * @returns {Promise<boolean>} Success status
 */
export async function deactivateShareCode(shareCodeId) {
    const deviceId = getDeviceId();

    try {
        // Verify ownership before deactivating
        const { data: permission, error: permissionError } = await supabase
            .from('share_permissions')
            .select(`
                profiles (device_id)
            `)
            .eq('id', shareCodeId)
            .single();

        if (permissionError) throw permissionError;

        if (permission.profiles.device_id !== deviceId) {
            throw new Error('Cannot deactivate share code: not the owner');
        }

        // Deactivate the code
        const { error } = await supabase
            .from('share_permissions')
            .update({ is_active: false })
            .eq('id', shareCodeId);

        if (error) throw error;

        console.log('✅ Deactivated share code');
        return true;

    } catch (error) {
        console.error('❌ Error deactivating share code:', error);
        throw error;
    }
}

/**
 * Validates a share code format
 * @param {string} shareCode Code to validate
 * @returns {boolean} True if format is valid
 */
export function validateShareCodeFormat(shareCode) {
    // Format: 3 consonants + 3 numbers (e.g., "BLT423")
    const codeRegex = /^[BCDFGHJKLMNPRSTVWXYZ]{3}[0-9]{3}$/i;
    return codeRegex.test(shareCode);
}

/**
 * Formats a share code for display
 * @param {string} shareCode Raw share code
 * @returns {string} Formatted share code (e.g., "BLT-423")
 */
export function formatShareCode(shareCode) {
    if (!shareCode || shareCode.length !== 6) return shareCode;
    return `${shareCode.substring(0, 3)}-${shareCode.substring(3)}`;
}

/**
 * Parses a formatted share code back to raw format
 * @param {string} formattedCode Formatted code (e.g., "BLT-423")
 * @returns {string} Raw share code (e.g., "BLT423")
 */
export function parseShareCode(formattedCode) {
    return formattedCode.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Gets share code statistics
 * @param {string} shareCodeId Share permission ID
 * @returns {Promise<Object>} Usage statistics
 */
export async function getShareCodeStats(shareCodeId) {
    try {
        const { data: permission, error } = await supabase
            .from('share_permissions')
            .select('*')
            .eq('id', shareCodeId)
            .single();

        if (error) throw error;

        // Get usage details from device_profiles
        const { data: deviceUsage, error: usageError } = await supabase
            .from('device_profiles')
            .select('device_id, shared_at, last_used')
            .eq('profile_id', permission.profile_id)
            .eq('access_type', 'shared')
            .order('shared_at', { ascending: false });

        if (usageError) throw usageError;

        return {
            ...permission,
            deviceCount: deviceUsage.length,
            recentUsage: deviceUsage.slice(0, 5),
            isExpired: permission.expires_at && new Date(permission.expires_at) < new Date(),
            usageRemaining: permission.max_uses ? permission.max_uses - permission.used_count : null
        };

    } catch (error) {
        console.error('❌ Error getting share code stats:', error);
        throw error;
    }
}

/**
 * Cleans up expired share codes for a profile
 * @param {string} profileId Profile ID
 * @returns {Promise<number>} Number of codes cleaned up
 */
export async function cleanupExpiredCodes(profileId) {
    try {
        const { data, error } = await supabase
            .from('share_permissions')
            .update({ is_active: false })
            .eq('profile_id', profileId)
            .eq('share_type', 'temporary')
            .lt('expires_at', new Date().toISOString())
            .eq('is_active', true)
            .select('id');

        if (error) throw error;

        console.log(`🧹 Cleaned up ${data.length} expired share codes`);
        return data.length;

    } catch (error) {
        console.error('❌ Error cleaning up expired codes:', error);
        return 0;
    }
}

/**
 * Creates a quick game session share code
 * @param {string} profileId Profile to share
 * @returns {Promise<string>} Share code for this game session
 */
export async function createGameSessionShare(profileId) {
    const sharePermission = await shareProfile(profileId, {
        shareType: 'game_session',
        maxUses: 10 // Allow multiple players to use it during setup
    });

    return sharePermission.share_code;
}