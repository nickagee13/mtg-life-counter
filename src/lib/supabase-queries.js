import { supabase } from './supabase';

// User Profile Queries
export const profileQueries = {
  // Get all profiles
  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get profile by ID
  async getProfile(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new profile
  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url || null,
        stats: {
          total_games: 0,
          wins: 0,
          total_turns: 0,
          total_duration: 0,
          commanders_played: {},
          colors_played: {},
          win_rate: 0
        }
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update profile stats
  async updateProfileStats(profileId, stats) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ stats })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Game Queries
export const gameQueries = {
  // Save complete game with participants
  async saveGame(gameData, participantsData) {
    try {
      // Insert game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert([{
          total_turns: gameData.total_turns,
          duration_minutes: Math.round(gameData.duration_seconds / 60),
          winner_profile_id: gameData.winner_profile_id,
          format: gameData.game_format || 'commander',
          player_count: gameData.player_count
        }])
        .select()
        .single();

      if (gameError) throw gameError;

      // Insert participants
      const participantsWithGameId = participantsData.map(p => ({
        ...p,
        game_id: game.id
      }));

      const { data: participants, error: participantsError } = await supabase
        .from('game_players')
        .insert(participantsWithGameId)
        .select();

      if (participantsError) throw participantsError;

      return { game, participants };
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  },

  // Get recent games
  async getRecentGames(limit = 10) {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        game_players (
          *,
          profiles (display_name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get games for a specific profile
  async getProfileGames(profileId, limit = 50) {
    const { data, error } = await supabase
      .from('game_players')
      .select(`
        *,
        games (
          *,
          game_players (
            *,
            profiles (display_name)
          )
        )
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get stats for profile
  async getProfileStats(profileId) {
    // Get basic stats from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stats')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;

    // Get detailed game history for calculations
    const { data: games, error: gamesError } = await supabase
      .from('game_players')
      .select(`
        *,
        games (
          total_turns,
          duration_minutes,
          created_at
        )
      `)
      .eq('profile_id', profileId);

    if (gamesError) throw gamesError;

    // Calculate detailed stats
    const totalGames = games.length;
    const wins = games.filter(g => g.placement === 1).length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    const avgDuration = totalGames > 0
      ? Math.round(games.reduce((sum, g) => sum + (g.games.duration_minutes * 60), 0) / totalGames)
      : 0;

    const avgTurns = totalGames > 0
      ? Math.round(games.reduce((sum, g) => sum + g.games.total_turns, 0) / totalGames * 10) / 10
      : 0;

    // Commander stats
    const commanderStats = {};
    games.forEach(g => {
      if (g.commander_name) {
        if (!commanderStats[g.commander_name]) {
          commanderStats[g.commander_name] = { games: 0, wins: 0 };
        }
        commanderStats[g.commander_name].games++;
        if (g.placement === 1) {
          commanderStats[g.commander_name].wins++;
        }
      }
    });

    // Color combination stats
    const colorStats = {};
    games.forEach(g => {
      const colorKey = g.commander_colors ? g.commander_colors.sort().join('') : 'Colorless';
      if (!colorStats[colorKey]) {
        colorStats[colorKey] = { games: 0, wins: 0 };
      }
      colorStats[colorKey].games++;
      if (g.placement === 1) {
        colorStats[colorKey].wins++;
      }
    });

    return {
      totalGames,
      wins,
      winRate,
      avgDuration,
      avgTurns,
      commanderStats,
      colorStats,
      recentGames: games.slice(0, 5).map(g => ({
        date: g.games.created_at,
        commander: g.commander_name,
        place: g.placement,
        turns: g.games.total_turns,
        duration: g.games.duration_minutes * 60
      }))
    };
  }
};

// Legacy support - migrate old games to new structure
export const migrationQueries = {
  async migrateOldGames() {
    try {
      // Get old games
      const { data: oldGames, error: oldGamesError } = await supabase
        .from('games')
        .select('*');

      if (oldGamesError) throw oldGamesError;

      // Get old players
      const { data: oldPlayers, error: oldPlayersError } = await supabase
        .from('players')
        .select('*');

      if (oldPlayersError) throw oldPlayersError;

      console.log('Found', oldGames.length, 'old games to migrate');
      console.log('Found', oldPlayers.length, 'old players to migrate');

      // For now, just log the data
      // Migration can be implemented when we're ready to run it
      return { oldGames, oldPlayers };
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
};