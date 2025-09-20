// Local storage utilities for managing recent players and profile data

const STORAGE_KEYS = {
  MY_PROFILE_ID: 'mtg_my_profile_id',
  RECENT_PLAYERS: 'mtg_recent_players',
  PROFILE_CACHE: 'mtg_profile_cache',
  SESSION_PLAYERS: 'mtg_session_players',
  LAST_USED_PROFILE: 'mtg_last_used_profile'
};

const MAX_RECENT_PLAYERS = 10;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Get the user's primary profile ID
 * @returns {string|null} Profile ID or null
 */
export function getMyProfileId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.MY_PROFILE_ID);
  } catch (error) {
    console.error('Error getting my profile ID:', error);
    return null;
  }
}

/**
 * Set the user's primary profile ID
 * @param {string} profileId - Profile ID to set
 */
export function setMyProfileId(profileId) {
  try {
    if (profileId) {
      localStorage.setItem(STORAGE_KEYS.MY_PROFILE_ID, profileId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.MY_PROFILE_ID);
    }
  } catch (error) {
    console.error('Error setting my profile ID:', error);
  }
}

/**
 * Get recent players list
 * @returns {Array} Array of recent player profiles
 */
export function getRecentPlayers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_PLAYERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting recent players:', error);
    return [];
  }
}

/**
 * Add a player to recent players list
 * @param {Object} player - Player profile object
 */
export function addRecentPlayer(player) {
  try {
    if (!player || !player.id) return;

    let recentPlayers = getRecentPlayers();

    // Remove if already exists (to move to front)
    recentPlayers = recentPlayers.filter(p => p.id !== player.id);

    // Add to front
    recentPlayers.unshift({
      id: player.id,
      username: player.username,
      display_name: player.display_name,
      share_code: player.share_code,
      primary_commander: player.primary_commander,
      last_used: Date.now()
    });

    // Limit to max recent players
    recentPlayers = recentPlayers.slice(0, MAX_RECENT_PLAYERS);

    localStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, JSON.stringify(recentPlayers));
  } catch (error) {
    console.error('Error adding recent player:', error);
  }
}

/**
 * Remove a player from recent players list
 * @param {string} playerId - ID of player to remove
 */
export function removeRecentPlayer(playerId) {
  try {
    const recentPlayers = getRecentPlayers();
    const filtered = recentPlayers.filter(p => p.id !== playerId);
    localStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing recent player:', error);
  }
}

/**
 * Clear all recent players
 */
export function clearRecentPlayers() {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENT_PLAYERS);
  } catch (error) {
    console.error('Error clearing recent players:', error);
  }
}

/**
 * Cache a profile for offline access
 * @param {Object} profile - Profile to cache
 */
export function cacheProfile(profile) {
  try {
    if (!profile || !profile.id) return;

    let cache = {};
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE_CACHE);
    if (stored) {
      cache = JSON.parse(stored);
    }

    cache[profile.id] = {
      ...profile,
      cached_at: Date.now()
    };

    localStorage.setItem(STORAGE_KEYS.PROFILE_CACHE, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching profile:', error);
  }
}

/**
 * Get cached profile
 * @param {string} profileId - ID of profile to retrieve
 * @returns {Object|null} Cached profile or null
 */
export function getCachedProfile(profileId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE_CACHE);
    if (!stored) return null;

    const cache = JSON.parse(stored);
    const profile = cache[profileId];

    if (!profile) return null;

    // Check if cache is expired
    const age = Date.now() - profile.cached_at;
    if (age > CACHE_DURATION) {
      delete cache[profileId];
      localStorage.setItem(STORAGE_KEYS.PROFILE_CACHE, JSON.stringify(cache));
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting cached profile:', error);
    return null;
  }
}

/**
 * Clear profile cache
 */
export function clearProfileCache() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE_CACHE);
  } catch (error) {
    console.error('Error clearing profile cache:', error);
  }
}

/**
 * Get session players (temporary for current game setup)
 * @returns {Array} Array of player profiles for current session
 */
export function getSessionPlayers() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION_PLAYERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting session players:', error);
    return [];
  }
}

/**
 * Set session players
 * @param {Array} players - Array of player profiles
 */
export function setSessionPlayers(players) {
  try {
    if (Array.isArray(players)) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_PLAYERS, JSON.stringify(players));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_PLAYERS);
    }
  } catch (error) {
    console.error('Error setting session players:', error);
  }
}

/**
 * Clear session players
 */
export function clearSessionPlayers() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_PLAYERS);
  } catch (error) {
    console.error('Error clearing session players:', error);
  }
}

/**
 * Get last used profile
 * @returns {Object|null} Last used profile or null
 */
export function getLastUsedProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_USED_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting last used profile:', error);
    return null;
  }
}

/**
 * Set last used profile
 * @param {Object} profile - Profile that was last used
 */
export function setLastUsedProfile(profile) {
  try {
    if (profile && profile.id) {
      localStorage.setItem(STORAGE_KEYS.LAST_USED_PROFILE, JSON.stringify({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        share_code: profile.share_code,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_USED_PROFILE);
    }
  } catch (error) {
    console.error('Error setting last used profile:', error);
  }
}

/**
 * Clear all local storage data for the app
 */
export function clearAllLocalData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all local data:', error);
  }
}

/**
 * Export all local data (for debugging or backup)
 * @returns {Object} All local storage data
 */
export function exportLocalData() {
  try {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const localValue = localStorage.getItem(key);
      const sessionValue = sessionStorage.getItem(key);

      if (localValue) {
        try {
          data[name] = JSON.parse(localValue);
        } catch {
          data[name] = localValue;
        }
      }

      if (sessionValue) {
        try {
          data[`${name}_session`] = JSON.parse(sessionValue);
        } catch {
          data[`${name}_session`] = sessionValue;
        }
      }
    });
    return data;
  } catch (error) {
    console.error('Error exporting local data:', error);
    return {};
  }
}