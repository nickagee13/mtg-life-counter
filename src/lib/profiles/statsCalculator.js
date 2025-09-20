// Statistics calculation utilities for player profiles

/**
 * Calculate win rate percentage
 * @param {number} wins - Number of wins
 * @param {number} totalGames - Total games played
 * @returns {number} Win rate percentage (0-100)
 */
export function calculateWinRate(wins, totalGames) {
  if (!totalGames || totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
}

/**
 * Calculate average placement
 * @param {Array} games - Array of game objects with placement field
 * @returns {number} Average placement
 */
export function calculateAveragePlacement(games) {
  if (!games || games.length === 0) return 0;

  const validPlacements = games.filter(g => g.placement && g.placement > 0);
  if (validPlacements.length === 0) return 0;

  const sum = validPlacements.reduce((acc, g) => acc + g.placement, 0);
  return Math.round((sum / validPlacements.length) * 10) / 10;
}

/**
 * Calculate commander-specific stats
 * @param {Array} games - Array of game objects
 * @returns {Object} Commander stats by commander name
 */
export function calculateCommanderStats(games) {
  const commanderStats = {};

  games.forEach(game => {
    if (!game.commander_name) return;

    if (!commanderStats[game.commander_name]) {
      commanderStats[game.commander_name] = {
        games: 0,
        wins: 0,
        totalPlacement: 0,
        eliminations: 0,
        damageDealt: 0,
        turnsPlayed: 0,
        colors: game.commander_colors || []
      };
    }

    const stats = commanderStats[game.commander_name];
    stats.games++;

    if (game.placement === 1) {
      stats.wins++;
    }

    if (game.placement) {
      stats.totalPlacement += game.placement;
    }

    stats.eliminations += game.eliminations || 0;
    stats.damageDealt += game.commander_damage_dealt || 0;
    stats.turnsPlayed += game.turns_survived || 0;
  });

  // Calculate derived stats
  Object.keys(commanderStats).forEach(commander => {
    const stats = commanderStats[commander];
    stats.winRate = calculateWinRate(stats.wins, stats.games);
    stats.avgPlacement = stats.games > 0 ?
      Math.round((stats.totalPlacement / stats.games) * 10) / 10 : 0;
    stats.avgDamage = stats.games > 0 ?
      Math.round(stats.damageDealt / stats.games) : 0;
    stats.avgTurns = stats.games > 0 ?
      Math.round((stats.turnsPlayed / stats.games) * 10) / 10 : 0;
  });

  return commanderStats;
}

/**
 * Calculate color combination stats
 * @param {Array} games - Array of game objects
 * @returns {Object} Stats by color combination
 */
export function calculateColorStats(games) {
  const colorStats = {};

  games.forEach(game => {
    if (!game.commander_colors || game.commander_colors.length === 0) {
      return;
    }

    // Sort colors for consistent key
    const colorKey = game.commander_colors.sort().join('');
    const displayName = getColorCombinationName(game.commander_colors);

    if (!colorStats[colorKey]) {
      colorStats[colorKey] = {
        colors: game.commander_colors,
        displayName: displayName,
        games: 0,
        wins: 0,
        totalPlacement: 0
      };
    }

    const stats = colorStats[colorKey];
    stats.games++;

    if (game.placement === 1) {
      stats.wins++;
    }

    if (game.placement) {
      stats.totalPlacement += game.placement;
    }
  });

  // Calculate derived stats
  Object.keys(colorStats).forEach(colorKey => {
    const stats = colorStats[colorKey];
    stats.winRate = calculateWinRate(stats.wins, stats.games);
    stats.avgPlacement = stats.games > 0 ?
      Math.round((stats.totalPlacement / stats.games) * 10) / 10 : 0;
  });

  return colorStats;
}

/**
 * Get display name for color combination
 * @param {Array} colors - Array of color codes
 * @returns {string} Display name for color combination
 */
export function getColorCombinationName(colors) {
  if (!colors || colors.length === 0) return 'Colorless';

  const colorNames = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green'
  };

  // Common combination names
  const combinations = {
    'WU': 'Azorius',
    'UB': 'Dimir',
    'BR': 'Rakdos',
    'RG': 'Gruul',
    'WG': 'Selesnya',
    'WB': 'Orzhov',
    'UR': 'Izzet',
    'BG': 'Golgari',
    'WR': 'Boros',
    'UG': 'Simic',
    'WUB': 'Esper',
    'UBR': 'Grixis',
    'BRG': 'Jund',
    'RGW': 'Naya',
    'WUG': 'Bant',
    'WBG': 'Abzan',
    'URW': 'Jeskai',
    'BGW': 'Sultai',
    'RUG': 'Temur',
    'BWR': 'Mardu',
    'WUBR': 'Yore-Tiller',
    'UBRG': 'Glint-Eye',
    'BRGW': 'Dune-Brood',
    'RGWU': 'Ink-Treader',
    'GWUB': 'Witch-Maw',
    'WUBRG': 'Five Color'
  };

  const sorted = colors.sort().join('');

  if (combinations[sorted]) {
    return combinations[sorted];
  }

  // Return color names if no nickname
  return colors.map(c => colorNames[c] || c).join('/');
}

/**
 * Calculate performance trends
 * @param {Array} games - Array of game objects sorted by date
 * @param {number} windowSize - Number of games to consider for trend
 * @returns {Object} Trend information
 */
export function calculateTrends(games, windowSize = 5) {
  if (!games || games.length < windowSize) {
    return {
      improving: false,
      declining: false,
      stable: true,
      recentWinRate: 0,
      overallWinRate: 0
    };
  }

  const recentGames = games.slice(0, windowSize);
  const olderGames = games.slice(windowSize, windowSize * 2);

  const recentWins = recentGames.filter(g => g.placement === 1).length;
  const olderWins = olderGames.filter(g => g.placement === 1).length;

  const recentWinRate = calculateWinRate(recentWins, recentGames.length);
  const olderWinRate = calculateWinRate(olderWins, olderGames.length);

  const totalWins = games.filter(g => g.placement === 1).length;
  const overallWinRate = calculateWinRate(totalWins, games.length);

  const difference = recentWinRate - olderWinRate;

  return {
    improving: difference > 10,
    declining: difference < -10,
    stable: Math.abs(difference) <= 10,
    recentWinRate,
    overallWinRate,
    trend: difference > 0 ? `+${difference}%` : `${difference}%`
  };
}

/**
 * Calculate streak information
 * @param {Array} games - Array of game objects sorted by date (newest first)
 * @returns {Object} Streak information
 */
export function calculateStreaks(games) {
  if (!games || games.length === 0) {
    return {
      currentStreak: 0,
      streakType: null,
      longestWinStreak: 0,
      longestLossStreak: 0
    };
  }

  let currentStreak = 0;
  let streakType = null;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  games.forEach((game, index) => {
    const isWin = game.placement === 1;

    // Current streak (from most recent games)
    if (index === 0) {
      currentStreak = 1;
      streakType = isWin ? 'win' : 'loss';
    } else if ((streakType === 'win' && isWin) || (streakType === 'loss' && !isWin)) {
      currentStreak++;
    } else if (currentStreak > 0 && index <= games.length) {
      // Streak broken, stop counting current
      currentStreak = currentStreak; // Keep the value
    }

    // Track longest streaks
    if (isWin) {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  });

  return {
    currentStreak,
    streakType,
    longestWinStreak,
    longestLossStreak
  };
}

/**
 * Get achievement badges based on stats
 * @param {Object} stats - Player statistics
 * @returns {Array} Array of achievement objects
 */
export function getAchievements(stats) {
  const achievements = [];

  // Win rate achievements
  if (stats.winRate >= 75 && stats.totalGames >= 10) {
    achievements.push({
      id: 'dominator',
      name: 'Dominator',
      description: '75%+ win rate',
      icon: '👑'
    });
  } else if (stats.winRate >= 50 && stats.totalGames >= 10) {
    achievements.push({
      id: 'champion',
      name: 'Champion',
      description: '50%+ win rate',
      icon: '🏆'
    });
  }

  // Games played achievements
  if (stats.totalGames >= 100) {
    achievements.push({
      id: 'veteran',
      name: 'Veteran',
      description: '100+ games played',
      icon: '⚔️'
    });
  } else if (stats.totalGames >= 50) {
    achievements.push({
      id: 'experienced',
      name: 'Experienced',
      description: '50+ games played',
      icon: '🎯'
    });
  } else if (stats.totalGames >= 10) {
    achievements.push({
      id: 'regular',
      name: 'Regular',
      description: '10+ games played',
      icon: '🎮'
    });
  }

  // Streak achievements
  if (stats.longestWinStreak >= 5) {
    achievements.push({
      id: 'unstoppable',
      name: 'Unstoppable',
      description: '5+ game win streak',
      icon: '🔥'
    });
  }

  // Commander diversity
  if (stats.uniqueCommanders >= 10) {
    achievements.push({
      id: 'explorer',
      name: 'Explorer',
      description: '10+ different commanders',
      icon: '🗺️'
    });
  }

  return achievements;
}

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate summary statistics
 * @param {Array} games - Array of game objects
 * @returns {Object} Summary statistics
 */
export function calculateSummaryStats(games) {
  if (!games || games.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      winRate: 0,
      avgPlacement: 0,
      avgDuration: 0,
      avgTurns: 0,
      totalDamageDealt: 0,
      favoriteCommander: null,
      favoriteColors: null,
      uniqueCommanders: 0,
      uniqueOpponents: 0
    };
  }

  const wins = games.filter(g => g.placement === 1).length;
  const winRate = calculateWinRate(wins, games.length);
  const avgPlacement = calculateAveragePlacement(games);

  // Duration stats
  const durations = games.filter(g => g.duration).map(g => g.duration);
  const avgDuration = durations.length > 0 ?
    Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Turn stats
  const turns = games.filter(g => g.turns_survived).map(g => g.turns_survived);
  const avgTurns = turns.length > 0 ?
    Math.round(turns.reduce((a, b) => a + b, 0) / turns.length) : 0;

  // Damage stats
  const totalDamageDealt = games.reduce((sum, g) =>
    sum + (g.commander_damage_dealt || 0), 0);

  // Commander frequency
  const commanderCounts = {};
  games.forEach(g => {
    if (g.commander_name) {
      commanderCounts[g.commander_name] = (commanderCounts[g.commander_name] || 0) + 1;
    }
  });

  const favoriteCommander = Object.keys(commanderCounts).length > 0 ?
    Object.entries(commanderCounts).sort((a, b) => b[1] - a[1])[0][0] : null;

  // Color frequency
  const colorCounts = {};
  games.forEach(g => {
    if (g.commander_colors) {
      const colorKey = g.commander_colors.sort().join('');
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
  });

  const favoriteColors = Object.keys(colorCounts).length > 0 ?
    Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0] : null;

  return {
    totalGames: games.length,
    wins,
    winRate,
    avgPlacement,
    avgDuration,
    avgTurns,
    totalDamageDealt,
    favoriteCommander,
    favoriteColors,
    uniqueCommanders: Object.keys(commanderCounts).length,
    uniqueOpponents: new Set(games.flatMap(g => g.opponents || [])).size
  };
}