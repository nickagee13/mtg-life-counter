# Profile Ownership & Privacy System - Implementation Plan

## Overview
This document outlines the technical implementation for adding profile ownership and privacy controls to the MTG Life Counter application, ensuring users only see their own profiles unless explicitly shared.

## Phase 1: Device-Based Ownership (MVP)
**Timeline: 2-3 days**
**Goal: Basic profile ownership without authentication**

### 1.1 Database Schema Updates

```sql
-- Migration: Add ownership fields to profiles table
ALTER TABLE profiles ADD COLUMN device_id TEXT;
ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN created_at_device TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create device_profiles table for local tracking
CREATE TABLE device_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT true,
    access_type TEXT DEFAULT 'owned', -- 'owned', 'shared', 'recent'
    shared_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, profile_id)
);

-- Create share_permissions table
CREATE TABLE share_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    share_code TEXT UNIQUE NOT NULL,
    share_type TEXT DEFAULT 'temporary', -- 'temporary', 'permanent', 'game_session'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_count INTEGER DEFAULT 0,
    max_uses INTEGER -- NULL = unlimited
);
```

### 1.2 Device ID Generation

```javascript
// src/lib/device/deviceId.js
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'mtg_device_id';

export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a unique device ID
        deviceId = `device_${uuidv4()}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}

export function getDeviceFingerprint() {
    // Enhanced fingerprinting for better device identification
    const fingerprint = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform
    };

    return btoa(JSON.stringify(fingerprint));
}
```

### 1.3 Profile Service Updates

```javascript
// src/lib/profiles/profileOwnership.js
import { supabase } from '../supabase';
import { getDeviceId } from '../device/deviceId';

export async function createOwnedProfile(profileData) {
    const deviceId = getDeviceId();

    // Create profile with device ownership
    const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
            ...profileData,
            device_id: deviceId,
            is_public: false // Private by default
        })
        .select()
        .single();

    if (error) throw error;

    // Track local ownership
    await supabase
        .from('device_profiles')
        .insert({
            device_id: deviceId,
            profile_id: profile.id,
            is_owner: true,
            access_type: 'owned'
        });

    return profile;
}

export async function getMyProfiles() {
    const deviceId = getDeviceId();

    // Get profiles owned by this device
    const { data, error } = await supabase
        .from('device_profiles')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('device_id', deviceId)
        .eq('access_type', 'owned');

    if (error) throw error;
    return data.map(d => d.profile);
}

export async function getAccessibleProfiles() {
    const deviceId = getDeviceId();

    // Get all profiles this device can access
    const { data, error } = await supabase
        .from('device_profiles')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('device_id', deviceId)
        .order('last_used', { ascending: false });

    if (error) throw error;

    // Also get public profiles
    const { data: publicProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true);

    return {
        owned: data.filter(d => d.access_type === 'owned').map(d => d.profile),
        shared: data.filter(d => d.access_type === 'shared').map(d => d.profile),
        recent: data.filter(d => d.access_type === 'recent').map(d => d.profile),
        public: publicProfiles || []
    };
}
```

### 1.4 Share Code System

```javascript
// src/lib/profiles/shareSystem.js
export async function shareProfile(profileId, shareOptions = {}) {
    const {
        shareType = 'temporary',
        expiresInHours = 24,
        maxUses = null
    } = shareOptions;

    const shareCode = generateShareCode();
    const expiresAt = shareType === 'temporary'
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : null;

    const { data, error } = await supabase
        .from('share_permissions')
        .insert({
            profile_id: profileId,
            share_code: shareCode,
            share_type: shareType,
            expires_at: expiresAt,
            max_uses: maxUses
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function useShareCode(shareCode) {
    const deviceId = getDeviceId();

    // Verify share code is valid
    const { data: permission, error } = await supabase
        .from('share_permissions')
        .select('*, profile:profiles(*)')
        .eq('share_code', shareCode)
        .single();

    if (error || !permission) {
        throw new Error('Invalid share code');
    }

    // Check expiration
    if (permission.expires_at && new Date(permission.expires_at) < new Date()) {
        throw new Error('Share code has expired');
    }

    // Check usage limit
    if (permission.max_uses && permission.used_count >= permission.max_uses) {
        throw new Error('Share code has reached maximum uses');
    }

    // Grant access to device
    await supabase
        .from('device_profiles')
        .upsert({
            device_id: deviceId,
            profile_id: permission.profile_id,
            is_owner: false,
            access_type: 'shared',
            shared_at: new Date()
        });

    // Increment usage count
    await supabase
        .from('share_permissions')
        .update({ used_count: permission.used_count + 1 })
        .eq('id', permission.id);

    return permission.profile;
}
```

### 1.5 UI Components

```javascript
// src/components/profiles/ProfilePrivacySettings.jsx
import React, { useState } from 'react';
import { Lock, Unlock, Share2, Users } from 'lucide-react';

const ProfilePrivacySettings = ({ profile, onUpdate }) => {
    const [isPublic, setIsPublic] = useState(profile.is_public);
    const [showShareModal, setShowShareModal] = useState(false);

    const togglePrivacy = async () => {
        const newIsPublic = !isPublic;
        await updateProfilePrivacy(profile.id, newIsPublic);
        setIsPublic(newIsPublic);
        onUpdate({ ...profile, is_public: newIsPublic });
    };

    return (
        <div className="privacy-settings">
            <div className="privacy-toggle">
                <button onClick={togglePrivacy}>
                    {isPublic ? <Unlock /> : <Lock />}
                    {isPublic ? 'Public Profile' : 'Private Profile'}
                </button>
                <p className="privacy-description">
                    {isPublic
                        ? 'Anyone can view and use this profile'
                        : 'Only you can see this profile'}
                </p>
            </div>

            <button onClick={() => setShowShareModal(true)}>
                <Share2 />
                Share Profile
            </button>

            {showShareModal && (
                <ShareProfileModal
                    profile={profile}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};
```

```javascript
// src/components/profiles/ShareProfileModal.jsx
import React, { useState } from 'react';
import { Copy, Clock, Infinity } from 'lucide-react';
import { shareProfile } from '../../lib/profiles/shareSystem';

const ShareProfileModal = ({ profile, onClose }) => {
    const [shareType, setShareType] = useState('temporary');
    const [duration, setDuration] = useState(24);
    const [shareCode, setShareCode] = useState(null);
    const [copying, setCopying] = useState(false);

    const generateShareCode = async () => {
        const share = await shareProfile(profile.id, {
            shareType,
            expiresInHours: shareType === 'temporary' ? duration : null
        });
        setShareCode(share.share_code);
    };

    const copyShareCode = async () => {
        setCopying(true);
        await navigator.clipboard.writeText(shareCode);
        setTimeout(() => setCopying(false), 2000);
    };

    return (
        <div className="share-modal">
            <h3>Share Profile: {profile.display_name}</h3>

            {!shareCode ? (
                <div className="share-options">
                    <div className="share-type">
                        <label>
                            <input
                                type="radio"
                                value="temporary"
                                checked={shareType === 'temporary'}
                                onChange={(e) => setShareType(e.target.value)}
                            />
                            <Clock size={16} />
                            Temporary (expires)
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="permanent"
                                checked={shareType === 'permanent'}
                                onChange={(e) => setShareType(e.target.value)}
                            />
                            <Infinity size={16} />
                            Permanent
                        </label>
                    </div>

                    {shareType === 'temporary' && (
                        <div className="duration-selector">
                            <label>Expires after:</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                            >
                                <option value={1}>1 hour</option>
                                <option value={24}>24 hours</option>
                                <option value={168}>1 week</option>
                                <option value={720}>30 days</option>
                            </select>
                        </div>
                    )}

                    <button onClick={generateShareCode}>
                        Generate Share Code
                    </button>
                </div>
            ) : (
                <div className="share-code-display">
                    <div className="code-box">
                        <span className="code">{shareCode}</span>
                        <button onClick={copyShareCode}>
                            <Copy size={16} />
                            {copying ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="share-instructions">
                        Share this code with others to let them use your profile
                        {shareType === 'temporary' && ` (expires in ${duration} hours)`}
                    </p>
                </div>
            )}

            <button onClick={onClose}>Close</button>
        </div>
    );
};
```

## Phase 2: Enhanced Authentication (Optional)
**Timeline: 3-4 days**
**Goal: Cross-device sync with email/password**

### 2.1 Supabase Auth Integration
- Email/password authentication
- OAuth providers (Google, Discord)
- Session management
- Password reset flow

### 2.2 Profile Migration
- Link existing device profiles to accounts
- Merge duplicate profiles
- Transfer ownership

## Phase 3: Social Features
**Timeline: 4-5 days**
**Goal: Friends system and advanced sharing**

### 3.1 Friends System
- Friend codes
- Friend requests
- Mutual friends discovery
- Block/unblock functionality

### 3.2 Advanced Permissions
- View-only access
- Stats sharing levels
- Game history privacy
- Commander deck privacy

## Implementation Priority

1. **Week 1**: Phase 1 (Device Ownership)
   - Database migrations
   - Device ID system
   - Basic privacy toggle
   - Share code generation

2. **Week 2**: Phase 2 (Authentication)
   - Supabase Auth setup
   - Login/signup flows
   - Profile linking

3. **Week 3**: Phase 3 (Social)
   - Friends system
   - Advanced sharing
   - Privacy controls

## Testing Strategy

### Unit Tests
```javascript
describe('Profile Ownership', () => {
    test('creates profile with device ownership', async () => {
        const profile = await createOwnedProfile({
            username: 'testuser',
            display_name: 'Test User'
        });
        expect(profile.device_id).toBe(getDeviceId());
        expect(profile.is_public).toBe(false);
    });

    test('share code expires correctly', async () => {
        const share = await shareProfile(profileId, {
            shareType: 'temporary',
            expiresInHours: 1
        });
        // Test expiration logic
    });
});
```

### Integration Tests
- Cross-device profile sharing
- Privacy settings persistence
- Share code validation
- Access control enforcement

## Migration Path

1. **Existing Profiles**:
   - All become public by default
   - Users notified of new privacy options
   - Can claim and privatize their profiles

2. **Backward Compatibility**:
   - Old share codes continue working
   - Public profiles remain accessible
   - No breaking changes

## Security Considerations

1. **Device ID Security**:
   - Stored in localStorage
   - Hashed for database storage
   - Regeneration protection

2. **Share Code Security**:
   - Cryptographically random
   - Rate limiting on attempts
   - Audit trail for usage

3. **Privacy Defaults**:
   - New profiles private by default
   - Explicit consent for sharing
   - Clear privacy indicators

## Success Metrics

- **Adoption Rate**: % of users setting profiles to private
- **Share Usage**: Number of profiles shared via codes
- **Cross-Device**: Users accessing profiles on multiple devices
- **Privacy Incidents**: Zero unauthorized profile access

## Next Steps

1. Review and approve plan
2. Set up development branch
3. Create database migrations
4. Implement Phase 1 MVP
5. User testing and feedback
6. Iterate and enhance

---

This plan ensures users like Nick and Gino will have complete control over their profile visibility while maintaining the collaborative gaming experience when desired.