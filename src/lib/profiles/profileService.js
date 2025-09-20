// Profile service for all Supabase CRUD operations
import { supabase } from '../supabase';
import {
  generateSafeShareCode,
  validateShareCode,
  parseShareCode
} from './codeGenerator';
import {
  cacheProfile,
  getCachedProfile,
  addRecentPlayer,
  setMyProfileId,
  getMyProfileId,
  setLastUsedProfile
} from './localStorage';
import {
  calculateSummaryStats,
  calculateCommanderStats,
  calculateColorStats
} from './statsCalculator';

/**
 * Create a new profile
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 */
export async function createProfile(profileData) {
  try {
    // Generate share code
    const shareCode = generateSafeShareCode();

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        username: profileData.username.toLowerCase(),
        display_name: profileData.display_name,
        share_code: shareCode,
        primary_commander: profileData.primary_commander || null,
        color_identity: profileData.color_identity || null,
        avatar_url: profileData.avatar_url || null
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('username')) {
        throw new Error('Username already taken. Please choose another.');
      }
      throw error;
    }

    // Cache the new profile
    cacheProfile(data);

    // Set as my profile if it's the first one
    const myProfileId = getMyProfileId();
    if (!myProfileId) {
      setMyProfileId(data.id);
    }

    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Get profile by ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Profile data
 */
export async function getProfile(profileId) {
  try {
    // Check cache first
    const cached = getCachedProfile(profileId);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;

    // Cache the profile
    cacheProfile(data);

    return data;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
}

/**
 * Get profile by share code
 * @param {string} shareCode - Share code (with or without spaces)
 * @returns {Promise<Object>} Profile data
 */
export async function getProfileByShareCode(shareCode) {
  try {
    // Parse and validate the share code
    const parsedCode = parseShareCode(shareCode);
    if (!validateShareCode(parsedCode)) {
      throw new Error('Invalid share code format');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('share_code', parsedCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('No profile found with this share code');
      }
      throw error;
    }

    // Add to recent players
    addRecentPlayer(data);

    // Cache the profile
    cacheProfile(data);

    return data;
  } catch (error) {
    console.error('Error getting profile by share code:', error);
    throw error;
  }
}

/**
 * Update profile
 * @param {string} profileId - Profile ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(profileId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;

    // Update cache
    cacheProfile(data);

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Get all profiles (for selection list)
 * @param {number} limit - Maximum number of profiles to return
 * @returns {Promise<Array>} Array of profiles
 */
export async function getAllProfiles(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, share_code, primary_commander, games_played, wins, win_rate')
      .order('last_seen', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting all profiles:', error);
    throw error;
  }
}

/**
 * Search profiles by username or display name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching profiles
 */
export async function searchProfiles(query) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, share_code, primary_commander')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }
}

/**
 * Get profile statistics
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Profile statistics
 */
export async function getProfileStats(profileId) {
  try {
    // Get all games for this profile
    const { data: games, error } = await supabase
      .from('game_players')
      .select(`
        *,
        games (
          id,
          total_turns,
          duration_minutes,
          created_at,
          format,
          player_count
        )
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data
    const transformedGames = games.map(g => ({
      ...g,
      duration: g.games?.duration_minutes * 60,
      total_turns: g.games?.total_turns,
      created_at: g.games?.created_at,
      format: g.games?.format,
      player_count: g.games?.player_count
    }));

    // Calculate statistics
    const summary = calculateSummaryStats(transformedGames);
    const commanderStats = calculateCommanderStats(transformedGames);
    const colorStats = calculateColorStats(transformedGames);

    return {
      summary,
      commanderStats,
      colorStats,
      recentGames: transformedGames.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting profile stats:', error);
    throw error;
  }
}

/**
 * Update profile stats after a game
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export async function updateProfileStatsForGame(gameId) {
  try {
    // Get all players from the game
    const { data: players, error } = await supabase
      .from('game_players')
      .select('profile_id, placement')
      .eq('game_id', gameId)
      .not('profile_id', 'is', null);

    if (error) throw error;

    // Update each profile's stats
    for (const player of players) {
      await updateProfileStatsManually(player.profile_id);
    }
  } catch (error) {
    console.error('Error updating profile stats for game:', error);
    throw error;
  }
}

/**
 * Manually recalculate and update profile statistics
 * @param {string} profileId - Profile ID
 * @returns {Promise<void>}
 */
async function updateProfileStatsManually(profileId) {
  try {
    // Get all games for this profile
    const { data: games, error: gamesError } = await supabase
      .from('game_players')
      .select('placement')
      .eq('profile_id', profileId);

    if (gamesError) throw gamesError;

    const totalGames = games.length;
    const wins = games.filter(g => g.placement === 1).length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        games_played: totalGames,
        wins: wins,
        win_rate: winRate,
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error manually updating profile stats:', error);
    throw error;
  }
}

/**
 * Save game with player profiles
 * @param {Object} gameData - Game data
 * @param {Array} players - Array of player data
 * @returns {Promise<Object>} Saved game data
 */
export async function saveGameWithProfiles(gameData, players) {
  try {
    // Create game record
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([{
        session_id: gameData.session_id || null,
        winner_profile_id: gameData.winner_profile_id || null,
        player_count: players.length,
        duration_minutes: Math.round((gameData.duration_seconds || 0) / 60),
        format: gameData.format || 'commander',
        total_turns: gameData.total_turns || 0
      }])
      .select()
      .single();

    if (gameError) throw gameError;

    // Create game_players records
    const gamePlayers = players.map((player, index) => ({
      game_id: game.id,
      profile_id: player.profile_id || null,
      player_position: index + 1,
      is_guest: !player.profile_id,
      guest_name: !player.profile_id ? player.name : null,
      starting_life: player.starting_life || 40,
      final_life: player.final_life || 0,
      commander_damage_dealt: player.commander_damage_dealt || 0,
      commander_damage_received: player.commander_damage_received || {},
      placement: player.placement || null,
      commander_name: player.commander || null,
      commander_colors: player.colors || null,
      turns_survived: player.turns_survived || 0,
      eliminations: player.eliminations || 0
    }));

    const { data: savedPlayers, error: playersError } = await supabase
      .from('game_players')
      .insert(gamePlayers)
      .select();

    if (playersError) throw playersError;

    // Update profile stats for all non-guest players
    await updateProfileStatsForGame(game.id);

    // Update last used profiles
    players.forEach(player => {
      if (player.profile_id && player.profile) {
        setLastUsedProfile(player.profile);
      }
    });

    return { game, players: savedPlayers };
  } catch (error) {
    console.error('Error saving game with profiles:', error);
    throw error;
  }
}

/**
 * Get recent games for a profile
 * @param {string} profileId - Profile ID
 * @param {number} limit - Maximum number of games
 * @returns {Promise<Array>} Recent games
 */
export async function getProfileRecentGames(profileId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('game_players')
      .select(`
        *,
        games (
          *,
          game_players (
            *,
            profiles (display_name, username)
          )
        )
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting profile recent games:', error);
    throw error;
  }
}

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if available
 */
export async function isUsernameAvailable(username) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      // PGRST116 means no rows returned, so username is available
      if (error.code === 'PGRST116') return true;
      throw error;
    }

    return false;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
}

/**
 * Delete profile (soft delete - sets is_active to false)
 * @param {string} profileId - Profile ID
 * @returns {Promise<void>}
 */
export async function deleteProfile(profileId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) throw error;

    // Clear from local storage if it was my profile
    const myProfileId = getMyProfileId();
    if (myProfileId === profileId) {
      setMyProfileId(null);
    }
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}