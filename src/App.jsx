import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, X, RotateCw, Save, Trophy, Skull, Swords, Shuffle, Moon, Sun, Dice6, Users, Clock } from 'lucide-react';
import { supabase } from './lib/supabase';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import GameCompleteScreen from './components/GameCompleteScreen';
import StatsScreen from './components/StatsScreen';
import ProfileManager from './components/profiles/ProfileManager';
import PlayerSlot from './components/profiles/PlayerSlot';
import { saveGameWithProfiles } from './lib/profiles/profileService';
import './App.css';

// Import mana color images
import whiteImage from './assets/images/white.jpeg';
import blueImage from './assets/images/blue.jpeg';
import blackImage from './assets/images/black.jpeg';
import redImage from './assets/images/red.png';
import greenImage from './assets/images/green.png';

// Import font
import matrixBoldFont from './Matrix-Bold.ttf';

const MTGCommanderTrackerInner = () => {
  const { currentProfile, selectProfile } = useProfile();
  // Prevent orientation-based layout changes
  React.useEffect(() => {
    // Add CSS to maintain static layouts regardless of device orientation
    const orientationStyle = document.createElement('style');
    orientationStyle.textContent = `
      /* Ensure layouts stay static regardless of device orientation */
      @media screen and (orientation: landscape) {
        .mtg-container {
          /* Layout stays the same even when device is rotated */
        }
      }
      
      @media screen and (orientation: portrait) {
        .mtg-container {
          /* Layout stays the same even when device is rotated */
        }
      }
    `;
    document.head.appendChild(orientationStyle);
    
    return () => document.head.removeChild(orientationStyle);
  }, []);

  // Add CSS for life change animation and MTG-style fonts
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Matrix Bold';
        src: url('${matrixBoldFont}') format('truetype');
        font-weight: bold;
        font-style: normal;
      }
      
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&display=swap');
      
      @keyframes fadeInOut {
        0% {
          opacity: 0;
          transform: translateY(-10px) translateX(0) scale(0.8);
        }
        20% {
          opacity: 1;
          transform: translateY(0) translateX(0) scale(1.1);
        }
        30% {
          transform: translateY(0) translateX(0) scale(1);
        }
        80% {
          opacity: 1;
          transform: translateY(0) translateX(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-20px) translateX(10px) scale(0.9);
        }
      }
      
      .mtg-title {
        font-family: 'Matrix Bold', 'Bebas Neue', sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      
      .mtg-text {
        font-family: 'Matrix Bold', 'Oswald', sans-serif;
      }
      
      .life-change-animation {
        animation: fadeInOut 10s ease-out forwards;
      }
      
      /* Force landscape-style layout for 2-player horizontal mode */
      .two-player-horizontal {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        display: flex !important;
        flex-direction: row !important;
      }
      
      .two-player-horizontal .player-card {
        width: 50vw !important;
        height: 100dvh !important;
        flex: none !important;
      }
      
      * {
        font-family: 'Matrix Bold', sans-serif !important;
      }
      
      .mtg-gradient {
        background: linear-gradient(135deg, #f97316 0%, #dc2626 50%, #991b1b 100%);
      }
      
      .mtg-gradient-light {
        background: linear-gradient(135deg, #fb923c 0%, #ef4444 50%, #b91c1c 100%);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Game states: 'profile', 'setup', 'layout', 'playing', 'finished', 'stats'
  const [gameState, setGameState] = useState('setup');
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [turnStartTime, setTurnStartTime] = useState(null);
  const [turnElapsedTime, setTurnElapsedTime] = useState(0);
  const [commanderDamage, setCommanderDamage] = useState({});
  const [showCommanderDamage, setShowCommanderDamage] = useState(false);
  const [selectedDamageDealer, setSelectedDamageDealer] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [commanderDamageMode, setCommanderDamageMode] = useState(null); // null or player index
  const [touchStart, setTouchStart] = useState(null);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [firstPlayerRoll, setFirstPlayerRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lifeChanges, setLifeChanges] = useState({}); // Track recent life changes for animation
  const [searchResults, setSearchResults] = useState({}); // Store search results for each player
  const [searchLoading, setSearchLoading] = useState({}); // Track loading state for each player
  const [failedImages, setFailedImages] = useState(new Set()); // Track failed commander images
  const [showProfileManager, setShowProfileManager] = useState(false);

  // Overall game timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && gameStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, gameStartTime]);

  // Turn timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && turnStartTime) {
      interval = setInterval(() => {
        setTurnElapsedTime(Math.floor((Date.now() - turnStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, turnStartTime]);

  // Check for game over condition
  useEffect(() => {
    if (gameState === 'playing' && players.length > 1) {
      const alivePlayers = players.filter(player => player.life > 0);

      if (alivePlayers.length === 1) {
        // Game over - only one player remaining
        setTimeout(() => {
          if (confirm(`Game Over! ${alivePlayers[0].name} wins! Would you like to end the game?`)) {
            endGame();
          }
        }, 1000); // Small delay to let the UI update first
      }
    }
  }, [players, gameState]);

  // Close search dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideAutocomplete = event.target.closest('[data-autocomplete]');
      if (!isInsideAutocomplete) {
        setSearchResults({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Preload commander images and handle failures
  useEffect(() => {
    players.forEach(player => {
      if (player.commanderImage && !failedImages.has(player.commanderImage)) {
        const img = new Image();
        img.onload = () => {
          // Image loaded successfully, no action needed
        };
        img.onerror = () => {
          // Image failed to load, add to failed set
          setFailedImages(prev => new Set([...prev, player.commanderImage]));
        };
        img.src = player.commanderImage;
      }
    });
  }, [players, failedImages]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const advanceToNextTurn = () => {
    // Reset turn timer
    setTurnStartTime(Date.now());
    setTurnElapsedTime(0);

    setActivePlayerIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % players.length;
      if (nextIndex === 0) {
        setCurrentTurn(prev => prev + 1);
      }
      return nextIndex;
    });
  };

  // Touch/swipe handling for commander damage (only in dedicated zones)
  const handleCommanderDamageTouch = (e, playerId) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      playerId,
      timestamp: Date.now()
    });
  };

  const handleCommanderDamageMove = (e, playerId) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If finger has moved significantly, consider it a swipe in progress
    if (distance > 20) {
      setIsSwipeInProgress(true);
    }

    // Early swipe detection for horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 25) {
      setCommanderDamageMode(playerId);
      setIsSwipeInProgress(true);
      e.preventDefault();
    }
  };

  const handleCommanderDamageEnd = (e, playerId) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const timeDelta = Date.now() - touchStart.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if it's a significant horizontal swipe (not vertical scroll or quick tap)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && distance > 50 && timeDelta > 100) {
      // Swipe detected - enter commander damage mode for this player
      setCommanderDamageMode(playerId);
      e.preventDefault(); // Prevent any other touch events
    }

    setTouchStart(null);
    setIsSwipeInProgress(false);
  };

  // Touch handling for life total changes (separate from commander damage)
  const handleLifeTotalTouch = (e, playerId, isRightSide) => {
    // Prevent triggering during commander damage mode
    if (commanderDamageMode) return;

    e.preventDefault();
    e.stopPropagation();

    // Determine if it's a right-click (context menu) for bigger changes
    const isBigChange = e.button === 2 || e.ctrlKey || e.metaKey;
    const delta = isRightSide ? (isBigChange ? 5 : 1) : (isBigChange ? -5 : -1);

    changeLife(playerId, delta);
  };

  // Commander damage functions
  const getCommanderDamageFrom = (targetPlayerId, dealerPlayerId) => {
    const key = `${targetPlayerId}-${dealerPlayerId}`;
    return commanderDamage[key] || 0;
  };

  const updateCommanderDamage = (targetPlayerId, dealerPlayerId, amount) => {
    const key = `${targetPlayerId}-${dealerPlayerId}`;
    const newValue = Math.max(0, (commanderDamage[key] || 0) + amount);

    // Only affect life if damage is actually being dealt (positive amount)
    if (amount > 0) {
      changeLife(targetPlayerId, -amount);
    }

    setCommanderDamage(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Check for lethal commander damage (21) - instantly kills player
    if (newValue >= 21) {
      setPlayers(prevPlayers => prevPlayers.map(p =>
        p.id === targetPlayerId
          ? { ...p, life: 0, eliminated: true, eliminatedTurn: currentTurn }
          : p
      ));
    }
  };

  // Debounce function for search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Search for commanders using Scryfall API
  const searchCommanders = async (query, playerId) => {
    if (!query || query.length < 2) {
      setSearchResults(prev => ({ ...prev, [playerId]: [] }));
      return;
    }

    setSearchLoading(prev => ({ ...prev, [playerId]: true }));

    try {
      const encodedQuery = encodeURIComponent(`type:legendary type:creature name:"${query}"`);
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=cards&order=name&dir=asc`);
      
      if (response.ok) {
        const data = await response.json();
        const commanders = data.data.slice(0, 10).map(card => ({
          name: card.name,
          mana_cost: card.mana_cost || '',
          type_line: card.type_line,
          set_name: card.set_name,
          image_background: card.image_uris?.art_crop || card.image_uris?.border_crop || card.image_uris?.normal || null,
          color_identity: card.color_identity || [],
          oracle_text: card.oracle_text || '',
          keywords: card.keywords || []
        }));
        setSearchResults(prev => ({ ...prev, [playerId]: commanders }));
      } else {
        setSearchResults(prev => ({ ...prev, [playerId]: [] }));
      }
    } catch (error) {
      console.error('Error searching commanders:', error);
      setSearchResults(prev => ({ ...prev, [playerId]: [] }));
    }

    setSearchLoading(prev => ({ ...prev, [playerId]: false }));
  };

  // Debounced search function
  const debouncedSearch = React.useCallback((query, playerId) => {
    debounce(searchCommanders, 300)(query, playerId);
  }, []);

  // Handle commander input change
  const handleCommanderChange = (playerId, value) => {
    updatePlayer(playerId, 'commander', value);
    
    // Only trigger search if the current value doesn't match a full commander name
    // This prevents search from triggering when the full name is already selected
    const player = players.find(p => p.id === playerId);
    const hasFullCommanderName = player && player.commander && player.commander === value && player.colors && player.colors.length > 0;
    
    if (value.length >= 2 && !hasFullCommanderName) {
      debouncedSearch(value, playerId);
    } else {
      setSearchResults(prev => ({ ...prev, [playerId]: [] }));
    }
  };

  // Select commander from search results
  const selectCommander = (playerId, commander) => {
    // Update commander name, colors, and background image together
    setPlayers(players.map(p =>
      p.id === playerId
        ? {
            ...p,
            commander: commander.name,
            colors: commander.color_identity,
            commanderImage: commander.image_background,
            commanderText: commander.oracle_text,
            commanderKeywords: commander.keywords
          }
        : p
    ));
    setSearchResults(prev => ({ ...prev, [playerId]: [] }));
  };

  // Add new player
  const addPlayer = () => {
    const newPlayer = {
      id: Date.now(),
      name: `Player ${players.length + 1}`,
      originalName: `Player ${players.length + 1}`,
      commander: '',
      colors: [],
      commanderImage: null,
      commanderText: '',
      commanderKeywords: [],
      life: 40,
      eliminated: false,
      eliminatedTurn: null,
      // Profile-related fields
      profile: null,
      profile_id: null,
      isGuest: true
    };
    setPlayers([...players, newPlayer]);
  };

  // Update player info
  const updatePlayer = (id, field, value) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Remove player
  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
    setFirstPlayerRoll(null); // Reset first player roll if players change
  };

  // Randomize first player
  const randomizeFirstPlayer = () => {
    if (players.length < 1) return;
    
    setIsRolling(true);
    setFirstPlayerRoll(null);
    
    // Animate rolling effect
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setFirstPlayerRoll(Math.floor(Math.random() * players.length));
      rollCount++;
      
      if (rollCount > 15) {
        clearInterval(rollInterval);
        const finalPlayer = Math.floor(Math.random() * players.length);
        setFirstPlayerRoll(finalPlayer);
        setIsRolling(false);
      }
    }, 100);
  };

  // Go to layout selection
  const startGame = () => {
    if (players.length < 1) {
      alert('Need at least 1 player to start!');
      return;
    }
    setGameState('layout');
  };

  // Actually start the game with selected layout
  const startGameWithLayout = () => {
    // Initialize commander damage tracking
    const damageMatrix = {};
    players.forEach(dealer => {
      damageMatrix[dealer.id] = {};
      players.forEach(receiver => {
        if (dealer.id !== receiver.id) {
          damageMatrix[dealer.id][receiver.id] = 0;
        }
      });
    });
    
    setCommanderDamage(damageMatrix);
    setGameState('playing');
    setGameStartTime(Date.now());
    setTurnStartTime(Date.now()); // Initialize turn timer
    setTurnElapsedTime(0);
    setLifeChanges({}); // Clear any life change animations
    // Use randomized first player if set, otherwise default to first player
    setActivePlayerIndex(firstPlayerRoll !== null ? firstPlayerRoll : 0);
  };

  // Change life total
  const changeLife = (playerId, delta) => {
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        const newLife = Math.max(0, p.life + delta);
        return { 
          ...p, 
          life: newLife,
          eliminated: newLife === 0 ? true : p.eliminated,
          eliminatedTurn: newLife === 0 && !p.eliminated ? currentTurn : p.eliminatedTurn
        };
      }
      return p;
    }));
    
    // Accumulate life changes instead of replacing
    setLifeChanges(prev => {
      const currentChange = prev[playerId] || 0;
      const newChange = currentChange + delta;
      
      // If the change would be 0, don't show it at all
      if (newChange === 0) {
        const newChanges = { ...prev };
        delete newChanges[playerId];
        return newChanges;
      }
      
      return {
        ...prev,
        [playerId]: newChange
      };
    });
    
    // Clear the animation after 2 seconds of no changes
    clearTimeout(window[`lifeChangeTimeout_${playerId}`]);
    window[`lifeChangeTimeout_${playerId}`] = setTimeout(() => {
      setLifeChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[playerId];
        return newChanges;
      });
    }, 10000);
  };


  // Next turn
  const nextTurn = () => {
    const activePlayers = players.filter(p => !p.eliminated);
    if (activePlayers.length <= 1 && players.length > 1) {
      endGame();
      return;
    }
    
    // For single player games, just increment turn counter
    if (players.length === 1) {
      setCurrentTurn(currentTurn + 1);
      return;
    }
    
    // Find next active player for multiplayer
    let nextIndex = (activePlayerIndex + 1) % players.length;
    while (players[nextIndex].eliminated) {
      nextIndex = (nextIndex + 1) % players.length;
    }
    
    setActivePlayerIndex(nextIndex);
    setCurrentTurn(currentTurn + 1);
  };

  // Helper function to calculate total commander damage dealt by a player
  const calculateTotalDamageDealt = (playerId) => {
    let totalDamage = 0;
    Object.values(commanderDamage).forEach(playerDamage => {
      if (playerDamage[playerId]) {
        totalDamage += playerDamage[playerId];
      }
    });
    return totalDamage;
  };

  // End the game and save to Supabase
const endGame = async () => {
  const winner = players.find(p => !p.eliminated);
  setGameState('finished');

  try {
    // Calculate final placements
    const alivePlayers = players.filter(p => !p.eliminated);
    const eliminatedPlayers = players.filter(p => p.eliminated)
      .sort((a, b) => (b.eliminatedTurn || 0) - (a.eliminatedTurn || 0)); // Latest elimination = higher placement

    // Assign placements: alive players get 1st place (or ties), then eliminated in reverse order
    const playersWithPlacements = [];

    // Alive players get placement 1 (winner) or tied for 1st if multiple alive
    alivePlayers.forEach(player => {
      playersWithPlacements.push({
        ...player,
        placement: 1
      });
    });

    // Eliminated players get placements starting from after alive players
    eliminatedPlayers.forEach((player, index) => {
      playersWithPlacements.push({
        ...player,
        placement: alivePlayers.length + index + 1
      });
    });

    // Prepare game data for profile service
    const gameData = {
      session_id: `game_${Date.now()}`,
      winner_profile_id: winner?.profile_id || null,
      duration_seconds: elapsedTime,
      total_turns: currentTurn,
      format: 'commander'
    };

    // Prepare players data with profile information
    const playersData = playersWithPlacements.map((player, index) => ({
      profile_id: player.profile_id || null,
      profile: player.profile || null,
      name: player.name,
      commander: player.commander || null,
      colors: player.colors || null,
      starting_life: 40,
      final_life: player.life,
      placement: player.placement,
      commander_damage_dealt: calculateTotalDamageDealt(player.id),
      commander_damage_received: commanderDamage[player.id] || {},
      turns_survived: player.eliminatedTurn || currentTurn,
      eliminations: 0 // TODO: Track actual eliminations in future
    }));

    console.log('Saving game with profiles:', { gameData, playersData });

    // Use the profile service to save the game
    await saveGameWithProfiles(gameData, playersData);

    console.log('✅ Game and player profiles updated successfully!');

  } catch (error) {
    console.error('❌ Error saving game:', error.message);
    alert('Game finished, but there was an error saving to database. Check console for details.');
    // Game still ends even if save fails
  }
};

  // Handle quick rematch (same players)
  const quickRematch = () => {
    // Reset game state but keep players
    setPlayers(players.map(p => ({
      ...p,
      life: 40,
      eliminated: false,
      eliminatedTurn: null
    })));
    setGameState('layout');
    setCurrentTurn(1);
    setActivePlayerIndex(firstPlayerRoll !== null ? firstPlayerRoll : 0);
    setGameStartTime(null);
    setElapsedTime(0);
    setCommanderDamage({});
    setLifeChanges({});
  };

  // View stats screen
  const viewStats = () => {
    setGameState('stats');
  };

  // Reset for new game
  const newGame = (keepPlayers = false) => {
    if (keepPlayers) {
      // Keep players but reset their game state
      setPlayers(players.map(p => ({
        ...p,
        life: 40,
        eliminated: false,
        eliminatedTurn: null
      })));
    } else {
      setPlayers([]);
    }
    
    setGameState('setup');
    setCurrentTurn(1);
    setActivePlayerIndex(0);
    setGameStartTime(null);
    setElapsedTime(0);
    setCommanderDamage({});
    setShowCommanderDamage(false);
    setFirstPlayerRoll(null);
    setSelectedLayout(null);
    setLifeChanges({}); // Clear any life change animations
  };

  // Color options for commanders
  const colorOptions = [
    { code: 'W', name: 'White', image: whiteImage },
    { code: 'U', name: 'Blue', image: blueImage },
    { code: 'B', name: 'Black', image: blackImage },
    { code: 'R', name: 'Red', image: redImage },
    { code: 'G', name: 'Green', image: greenImage }
  ];


  const toggleColor = (playerId, colorCode) => {
    const player = players.find(p => p.id === playerId);
    const colors = player.colors || [];
    const newColors = colors.includes(colorCode)
      ? colors.filter(c => c !== colorCode)
      : [...colors, colorCode];
    updatePlayer(playerId, 'colors', newColors);
  };

  // Layout helper functions
  const getLayoutStyles = (layout, playerCount) => {
    if (playerCount === 2) {
      if (layout === '2-horizontal') {
        // Horizontal layout for landscape mobile - side by side, full height
        // Force landscape-style layout regardless of device orientation
        return {
          display: 'flex',
          flexDirection: 'row',
          gap: '0.25rem',
          height: '100dvh',
          width: '100vw',
          position: 'fixed',
          top: '0',
          left: '0',
          overflow: 'hidden'
        };
      } else {
        // Vertical layout for portrait mobile
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        };
      }
    }
    
    if (playerCount === 3) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '0.5rem'
      };
    }
    
    if (playerCount === 4) {
      switch (layout) {
        case '4-grid':
          return {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '0.5rem'
          };
        case '4-vertical':
          return {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          };
        default:
          return {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '0.5rem'
          };
      }
    }
    
    return {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    };
  };

  const getPlayerCardStyle = (layout, playerCount, playerIndex) => {
    if (playerCount === 2) {
      const baseStyle = {
        flex: layout === '2-horizontal' ? 'none' : '1',
        padding: layout === '2-horizontal' ? '1rem' : '1rem',
        height: layout === '2-horizontal' ? '100dvh' : '100%',
        minHeight: layout === '2-horizontal' ? '100vh' : '200px',
        width: layout === '2-horizontal' ? '50vw' : 'auto'
      };
      
      if (layout === '2-horizontal' && playerIndex === 0) {
        // For "left and right" layout, rotate Player 2 (left side) 180 degrees
        return {
          ...baseStyle,
          transform: 'rotate(180deg)'
        };
      } else if (layout === '2-vertical' && playerIndex === 0) {
        // For "top and bottom" layout, rotate the first player (top)
        return {
          ...baseStyle,
          transform: 'rotate(180deg)'
        };
      }
      
      return baseStyle;
    }
    
    if (playerCount === 3) {
      // First player takes full width top, other two split bottom
      if (playerIndex === 0) {
        return {
          gridColumn: '1 / -1',
          padding: '0.75rem',
          height: '100%'
        };
      }
      return {
        padding: '0.75rem',
        height: '100%'
      };
    }
    
    if (playerCount === 4) {
      if (layout === '4-vertical') {
        return {
          flex: '1',
          padding: '0.5rem',
          height: '100%'
        };
      }
      // Default grid layout
      return {
        padding: '0.75rem',
        height: '100%'
      };
    }
    
    return {
      flex: '1',
      padding: '1rem',
      height: '100%'
    };
  };

  // Updated styles to match mockup - dark navy background

  // Render game setup screen
  if (gameState === 'setup') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
          {/* Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {/* Profile button */}
            <button
              onClick={() => setShowProfileManager(true)}
              style={{
                height: '3rem',
                padding: '0 0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                border: `2px solid ${darkMode ? '#8b5cf6' : '#8b5cf6'}`,
                color: darkMode ? '#8b5cf6' : '#8b5cf6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                {currentProfile ? currentProfile.display_name : 'Select Profile'}
              </span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(45, 55, 72, 0.1)',
                border: `2px solid ${darkMode ? '#ffc107' : '#2d3748'}`,
                color: darkMode ? '#ffc107' : '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
          
          <div style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header with gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
              color: 'white',
              padding: '1rem 1.5rem 0.5rem 1.5rem',
              textAlign: 'center'
            }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                margin: '1rem 0 0.5rem 0',
                letterSpacing: '0.05em',
                fontFamily: "'Matrix Bold', sans-serif",
                color: 'black'
              }}>
                MTG LIFE COUNTER
              </h1>
            </div>
            
            {/* Player setup area */}
            <div style={{
              backgroundColor: darkMode ? '#1a202c' : '#ffffff',
              padding: '1.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {players.map((player, index) => (
                <div key={player.id} style={{ marginBottom: '1rem' }}>
                  {firstPlayerRoll === index && (
                    <div style={{
                      color: '#ff6b35',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(255, 107, 53, 0.1)',
                      borderRadius: '0.5rem',
                      border: '2px solid #ff6b35'
                    }}>
                      <Dice6 size={16} />
                      GOES FIRST!
                    </div>
                  )}

                  <PlayerSlot
                    index={index}
                    player={player}
                    onUpdate={(updatedPlayer) => {
                      setPlayers(players.map(p =>
                        p.id === player.id ? updatedPlayer : p
                      ));
                    }}
                    onRemove={() => removePlayer(player.id)}
                    existingProfiles={players.map(p => p.profile).filter(Boolean)}
                    darkMode={darkMode}
                    showCommander={true}
                    searchResults={searchResults[player.id] || []}
                    searchLoading={searchLoading[player.id] || false}
                    onSearchCommanders={(query) => searchCommanders(query, player.id)}
                  />
                </div>
              ))}

              {/* LEGACY PLAYER SETUP - HIDDEN */}
              {false && players.map((player, index) => (
                <div 
                  key={player.id} 
                  style={{
                    backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: firstPlayerRoll === index 
                      ? '2px solid #ff6b35' 
                      : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                    boxShadow: firstPlayerRoll === index 
                      ? '0 0 0 3px rgba(255, 107, 53, 0.1)' 
                      : 'none'
                  }}
                >
                  {firstPlayerRoll === index && (
                    <div style={{
                      color: '#ff6b35',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Dice6 size={14} />
                      GOES FIRST!
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      onFocus={(e) => {
                        // Clear default "Player X" names when focused
                        if (e.target.value.startsWith('Player ')) {
                          updatePlayer(player.id, 'name', '');
                        }
                      }}
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: '600',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        outline: 'none',
                        paddingBottom: '0.25rem',
                        fontFamily: "'Windsor BT', serif",
                        textTransform: 'capitalize'
                      }}
                      placeholder="Player name"
                    />
                    <button
                      onClick={() => removePlayer(player.id)}
                      style={{
                        color: '#e53e3e',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div data-autocomplete style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      data-player-id={player.id}
                      value={player.commander || ''}
                      onChange={(e) => {
                        // If commander is fully selected (has colors), make input read-only
                        if (player.colors && player.colors.length > 0) {
                          e.preventDefault();
                          return false;
                        }
                        handleCommanderChange(player.id, e.target.value);
                      }}
                      readOnly={player.colors && player.colors.length > 0}
                      style={{
                        width: '100%',
                        fontSize: '0.875rem',
                        backgroundColor: darkMode ? '#1a202c' : '#edf2f7',
                        color: darkMode ? '#cbd5e0' : '#4a5568',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e2e8f0'}`,
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none',
                        textTransform: 'none'
                      }}
                      placeholder="Search for commander..."
                    />
                    
                    {/* Loading indicator */}
                    {searchLoading[player.id] && (
                      <div style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: darkMode ? '#a0aec0' : '#718096',
                        fontSize: '0.75rem'
                      }}>
                        Searching...
                      </div>
                    )}
                    

                    {/* Clear commander button when commander is selected */}
                    {player.commander && player.colors && player.colors.length > 0 && (
                      <button
                        onClick={() => {
                          updatePlayer(player.id, 'commander', '');
                          updatePlayer(player.id, 'colors', []);
                          updatePlayer(player.id, 'commanderImage', null);
                          updatePlayer(player.id, 'commanderText', '');
                          updatePlayer(player.id, 'commanderKeywords', []);
                          // Focus the input and position cursor at start
                          const input = document.querySelector(`input[data-player-id="${player.id}"]`);
                          if (input) {
                            setTimeout(() => {
                              input.focus();
                              input.setSelectionRange(0, 0);
                            }, 0);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: darkMode ? '#a0aec0' : '#718096',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem'
                        }}
                        title="Clear commander selection"
                      >
                        <X size={16} />
                      </button>
                    )}
                    
                    {/* Search results dropdown */}
                    {searchResults[player.id] && searchResults[player.id].length > 0 && !(player.commander && player.colors && player.colors.length > 0) && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        right: '1rem',
                        zIndex: 1000,
                        backgroundColor: darkMode ? '#1a202c' : '#ffffff',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e2e8f0'}`,
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {searchResults[player.id].map((commander, index) => (
                          <div
                            key={`${commander.name}-${index}`}
                            onClick={() => selectCommander(player.id, commander)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: index < searchResults[player.id].length - 1 
                                ? `1px solid ${darkMode ? '#2d3748' : '#e2e8f0'}` 
                                : 'none',
                              backgroundColor: 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = darkMode ? '#2d3748' : '#f7fafc';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{
                              fontWeight: '600',
                              color: darkMode ? '#e2e8f0' : '#2d3748',
                              fontSize: '0.875rem'
                            }}>
                              {commander.name}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: darkMode ? '#a0aec0' : '#718096',
                              marginTop: '0.125rem'
                            }}>
                              {commander.type_line} • {commander.set_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {player.commander ? (
                        // Show commander's colors as read-only indicators
                        <>
                          {colorOptions.map(color => {
                            const isCommanderColor = player.colors?.includes(color.code);
                            if (!isCommanderColor) return null;
                            
                            return (
                              <div
                                key={color.code}
                                style={{
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  border: '3px solid #10b981',
                                  padding: '0',
                                  overflow: 'hidden',
                                  backgroundImage: `url(${color.image})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                }}
                                title={`${color.name} (Commander color)`}
                              />
                            );
                          })}
                          {(!player.colors || player.colors.length === 0) && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: darkMode ? '#a0aec0' : '#718096',
                              fontStyle: 'italic'
                            }}>
                              Colorless commander
                            </span>
                          )}
                        </>
                      ) : (
                        // Show manual color selection when no commander is chosen
                        <>
                          {colorOptions.map(color => (
                            <button
                              key={color.code}
                              onClick={() => toggleColor(player.id, color.code)}
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                border: player.colors?.includes(color.code) 
                                  ? '3px solid #2d3748' 
                                  : `2px solid ${darkMode ? '#4a5568' : '#cbd5e0'}`,
                                cursor: 'pointer',
                                transform: player.colors?.includes(color.code) ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s',
                                padding: '0',
                                overflow: 'hidden',
                                backgroundImage: `url(${color.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                              title={color.name}
                            />
                          ))}
                        </>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Keywords display */}
                      {player.commander && player.commanderKeywords && player.commanderKeywords.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.25rem',
                          alignItems: 'center'
                        }}>
                          {player.commanderKeywords.slice(0, 4).map((keyword, index) => (
                            <span
                              key={index}
                              style={{
                                fontSize: '0.625rem',
                                padding: '0.125rem 0.375rem',
                                backgroundColor: darkMode ? '#4a5568' : '#cbd5e0',
                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                borderRadius: '0.25rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                          {player.commanderKeywords.length > 4 && (
                            <span style={{
                              fontSize: '0.625rem',
                              color: darkMode ? '#a0aec0' : '#718096',
                              fontWeight: '500'
                            }}>
                              +{player.commanderKeywords.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ))}
              {/* END LEGACY PLAYER SETUP */}

              {players.length < 4 && (
                <button
                  onClick={addPlayer}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px dashed ${darkMode ? '#4a5568' : '#cbd5e0'}`,
                    backgroundColor: 'transparent',
                    color: darkMode ? '#a0aec0' : '#718096',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}
                >
                  <Plus size={20} />
                  <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>ADD PLAYER {players.length + 1}</span>
                </button>
              )}
              
              {players.length >= 1 && (
                <button
                  onClick={randomizeFirstPlayer}
                  disabled={isRolling}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    letterSpacing: '0.025em',
                    marginBottom: '1rem',
                    backgroundColor: darkMode ? '#2d3748' : '#4a5568',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Shuffle size={20} style={{ animation: isRolling ? 'spin 1s linear infinite' : 'none' }} />
                  {isRolling ? 'ROLLING...' : 'RANDOMIZE FIRST PLAYER'}
                </button>
              )}
              
              <button
                onClick={startGame}
                disabled={players.length < 1}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1.125rem',
                  letterSpacing: '0.05em',
                  background: players.length >= 1 
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)'
                    : darkMode ? '#4a5568' : '#a0aec0',
                  border: 'none',
                  cursor: players.length >= 1 ? 'pointer' : 'not-allowed',
                  boxShadow: players.length >= 1 ? '0 4px 14px 0 rgba(255, 107, 53, 0.39)' : 'none'
                }}
              >
                START GAME
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Profile Manager Modal */}
          {showProfileManager && (
            <ProfileManager
              darkMode={darkMode}
              onClose={() => setShowProfileManager(false)}
              onProfileChange={(profile) => {
                console.log('Profile changed:', profile);
                selectProfile(profile);
                setShowProfileManager(false);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Render layout preview visual
  const renderLayoutPreview = (layoutId, playerCount) => {
    // Base preview container
    const getPreviewStyle = (layoutId) => {
      if (playerCount === 2 && layoutId === '2-horizontal') {
        // Landscape preview for left/right
        return {
          width: '80px',
          height: '45px',
          backgroundColor: 'transparent',
          border: '2px solid #ff6b35',
          borderRadius: '8px',
          display: 'flex',
          padding: '4px',
          gap: '2px'
        };
      } else {
        // Portrait preview for top/bottom
        return {
          width: '50px',
          height: '70px',
          backgroundColor: 'transparent',
          border: '2px solid #ff6b35',
          borderRadius: '8px',
          display: 'flex',
          padding: '4px',
          gap: '2px'
        };
      }
    };

    const previewStyle = getPreviewStyle(layoutId);
    
    const cardStyle = {
      backgroundColor: '#ff6b35',
      borderRadius: '4px',
      flex: '1'
    };

    if (playerCount === 2) {
      if (layoutId === '2-horizontal') {
        // Left & Right (landscape phone orientation)
        return (
          <div style={{...previewStyle, flexDirection: 'row'}}>
            <div style={cardStyle}></div>
            <div style={cardStyle}></div>
          </div>
        );
      } else {
        // Top and bottom (portrait phone orientation)
        return (
          <div style={{...previewStyle, flexDirection: 'column'}}>
            <div style={cardStyle}></div>
            <div style={cardStyle}></div>
          </div>
        );
      }
    } else if (playerCount === 3) {
      if (layoutId === '3-triangle') {
        return (
          <div style={previewStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '2px' }}>
              <div style={{ ...cardStyle, height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '2px' }}>
              <div style={{ ...cardStyle, height: '48%' }}></div>
              <div style={{ ...cardStyle, height: '48%' }}></div>
            </div>
          </div>
        );
      } else {
        return (
          <div style={previewStyle}>
            <div style={cardStyle}></div>
            <div style={cardStyle}></div>
            <div style={cardStyle}></div>
          </div>
        );
      }
    } else if (playerCount === 4) {
      if (layoutId === '4-grid') {
        return (
          <div style={previewStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '2px' }}>
              <div style={{ ...cardStyle, height: '48%' }}></div>
              <div style={{ ...cardStyle, height: '48%' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '2px' }}>
              <div style={{ ...cardStyle, height: '48%' }}></div>
              <div style={{ ...cardStyle, height: '48%' }}></div>
            </div>
          </div>
        );
      } else {
        return (
          <div style={previewStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '1px' }}>
              <div style={{ ...cardStyle, height: '23%' }}></div>
              <div style={{ ...cardStyle, height: '23%' }}></div>
              <div style={{ ...cardStyle, height: '23%' }}></div>
              <div style={{ ...cardStyle, height: '23%' }}></div>
            </div>
          </div>
        );
      }
    }

    return (
      <div style={previewStyle}>
        <div style={cardStyle}></div>
      </div>
    );
  };

  // Render layout selection screen
  if (gameState === 'layout') {
    const getLayoutOptions = () => {
      const count = players.length;
      if (count === 2) {
        return [
          { 
            id: '2-vertical', 
            name: '2 Players - Top & Bottom',
            description: 'Two player cards stacked vertically'
          },
          { 
            id: '2-horizontal', 
            name: '2 Players - Left & Right',
            description: 'Two player cards side by side'
          }
        ];
      } else if (count === 3) {
        return [
          { 
            id: '3-triangle', 
            name: '3 Players - Triangle',
            description: 'Three players in triangular arrangement'
          },
          { 
            id: '3-line', 
            name: '3 Players - Line',
            description: 'Three players in a horizontal line'
          }
        ];
      } else if (count === 4) {
        return [
          { 
            id: '4-grid', 
            name: '4 Players - Grid',
            description: '2x2 grid layout'
          },
          { 
            id: '4-vertical', 
            name: '4 Players - Vertical',
            description: 'Two columns of two players each'
          }
        ];
      } else {
        return [
          { 
            id: 'default', 
            name: 'Default Layout',
            description: 'Standard horizontal layout'
          }
        ];
      }
    };

    const layoutOptions = getLayoutOptions();

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
          {/* Dark mode toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(45, 55, 72, 0.1)',
                border: `2px solid ${darkMode ? '#ffc107' : '#2d3748'}`,
                color: darkMode ? '#ffc107' : '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
          
          <div style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
              color: 'white',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <h1 style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold', 
                margin: '0',
                letterSpacing: '0.05em',
                fontFamily: "'Matrix Bold', sans-serif",
                color: 'black'
              }}>
                CHOOSE LAYOUT
              </h1>
              <p style={{
                fontSize: '1rem',
                margin: '0.5rem 0 0 0',
                opacity: 0.9,
                color: 'black'
              }}>
                Select how to arrange {players.length} player{players.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Layout options */}
            <div style={{
              backgroundColor: darkMode ? '#1a202c' : '#ffffff',
              padding: '1.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    backgroundColor: selectedLayout === layout.id 
                      ? (darkMode ? '#4a5568' : '#e2e8f0')
                      : (darkMode ? '#2d3748' : '#f7fafc'),
                    border: selectedLayout === layout.id 
                      ? '2px solid #ff6b35' 
                      : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Windsor BT', serif",
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  {/* Visual Preview */}
                  <div style={{ flexShrink: 0 }}>
                    {renderLayoutPreview(layout.id, players.length)}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: darkMode ? '#e2e8f0' : '#2d3748'
                    }}>
                      {layout.name}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: darkMode ? '#a0aec0' : '#718096'
                    }}>
                      {layout.description}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Back and Continue buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setGameState('setup')}
                  style={{
                    flex: '1',
                    padding: '0.75rem',
                    backgroundColor: darkMode ? '#4a5568' : '#4a5568',
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Windsor BT', serif"
                  }}
                >
                  BACK
                </button>
                <button
                  onClick={startGameWithLayout}
                  disabled={!selectedLayout}
                  style={{
                    flex: '2',
                    padding: '0.75rem',
                    background: selectedLayout
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)'
                      : (darkMode ? '#4a5568' : '#a0aec0'),
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: selectedLayout ? 'pointer' : 'not-allowed',
                    fontFamily: "'Windsor BT', serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  START GAME
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render game playing screen  
  if (gameState === 'playing') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#2d3748' : '#f7fafc', 
        padding: '0.25rem',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: selectedLayout === '2-horizontal' ? 'none' : '48rem', 
          margin: '0 auto', 
          height: '100dvh', 
          display: 'flex', 
          flexDirection: 'column',
          width: selectedLayout === '2-horizontal' ? '100%' : 'auto'
        }}>
          
          {/* Simplified Player Grid */}
          <div 
            className={selectedLayout === '2-horizontal' ? 'two-player-horizontal' : ''}
            style={{ 
              flex: '1',
              position: 'relative',
              ...getLayoutStyles(selectedLayout, players.length)
            }}>
            {(selectedLayout === '2-horizontal' && players.length === 2
              ? [...players].reverse()
              : players
            ).map((player, index) => {
              // For 2-horizontal layout, we've reversed the array so Player 1 is now at index 1 (right)
              const originalIndex = selectedLayout === '2-horizontal' && players.length === 2
                ? players.findIndex(p => p.id === player.id)
                : index;
              const isActive = originalIndex === activePlayerIndex;
              
              // Get player background - use commander image if available, otherwise gradient
              const getPlayerBackground = (player, index) => {
                if (player.commanderImage && !failedImages.has(player.commanderImage)) {
                  return `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${player.commanderImage})`;
                }
                const gradients = [
                  'linear-gradient(135deg, #fbbf24 0%, #3b82f6 100%)', // Yellow to Blue
                  'linear-gradient(135deg, #10b981 0%, #059669 50%, #1e40af 100%)', // Green gradient
                  'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #7c2d12 100%)', // Red gradient
                  'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #3730a3 100%)', // Purple gradient
                ];
                return gradients[index % gradients.length];
              };
              
              return (
                <div
                  key={player.id}
                  className={selectedLayout === '2-horizontal' ? 'player-card' : ''}
                  style={{
                    ...getPlayerCardStyle(selectedLayout, players.length, index),
                    borderRadius: '1rem',
                    position: 'relative',
                    color: 'white',
                    background: getPlayerBackground(player, originalIndex),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: selectedLayout === '2-horizontal' ? '0' : '0.25rem',
                    touchAction: 'manipulation',
                    border: isActive ? '3px solid #fbbf24' : '2px solid rgba(255,255,255,0.2)',
                    boxShadow: isActive ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)' : 'none',
                    transition: 'border 0.3s ease, box-shadow 0.3s ease'
                  }}
                >
                  {/* Life Total Touch Zones - Left half (decrease) and Right half (increase) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      zIndex: 1
                    }}
                    onMouseDown={(e) => handleLifeTotalTouch(e, player.id, false)}
                    onTouchStart={(e) => handleLifeTotalTouch(e, player.id, false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '100%',
                      zIndex: 1
                    }}
                    onMouseDown={(e) => handleLifeTotalTouch(e, player.id, true)}
                    onTouchStart={(e) => handleLifeTotalTouch(e, player.id, true)}
                  />

                  {/* Commander Damage Swipe Zone - positioned next to timer */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '1rem', // Fixed to left edge of player card
                        right: '140px', // Fixed to just left of timer (110px wide + 30px gap)
                        height: '70px',
                        zIndex: 5,
                        borderRadius: '0.5rem'
                      }}
                      onTouchStart={(e) => handleCommanderDamageTouch(e, player.id)}
                      onTouchMove={(e) => handleCommanderDamageMove(e, player.id)}
                      onTouchEnd={(e) => handleCommanderDamageEnd(e, player.id)}
                    />
                  )}
                  {/* Grey overlay for eliminated players (0 life) */}
                  {player.life <= 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        textAlign: 'center'
                      }}>
                        ELIMINATED
                      </div>
                    </div>
                  )}

                  {/* Turn/Timer Display for Active Player */}
                  {isActive && (
                    <div
                      onClick={advanceToNextTurn}
                      style={{
                        position: 'absolute',
                        // Position timers in bottom-right for both players
                        bottom: '1rem',
                        right: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        borderRadius: '0.75rem',
                        padding: '0.5rem',
                        fontSize: '1.375rem',
                        width: '110px',
                        height: '70px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        userSelect: 'none',
                        textAlign: 'center',
                        zIndex: 10,
                        border: '3px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                        pointerEvents: 'all'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>{currentTurn}</span>
                        {showTimer && (
                          <>
                            <div style={{
                              width: '2px',
                              height: '1.5rem',
                              backgroundColor: 'rgba(255,255,255,0.6)'
                            }}></div>
                            <span>{formatTime(turnElapsedTime)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Commander Damage Indicator */}
                  {(() => {
                    const totalDamage = players.reduce((total, otherPlayer) => {
                      if (otherPlayer.id !== player.id) {
                        return total + getCommanderDamageFrom(player.id, otherPlayer.id);
                      }
                      return total;
                    }, 0);
                    
                    if (totalDamage > 0) {
                      return (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '1rem',
                          backgroundColor: 'rgba(255, 107, 53, 0.9)',
                          borderRadius: '50%',
                          width: '2.5rem',
                          height: '2.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Swords size={16} />
                            <span>{totalDamage}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Player Name */}
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {player.name}
                  </div>

                  {/* Life Total */}
                  <div style={{
                    fontSize: '9rem', 
                    fontWeight: 'bold', 
                    lineHeight: '1',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                    position: 'relative'
                  }}>
                    {player.life}
                    
                    {/* Life Change Animation */}
                    {lifeChanges[player.id] && (
                      <div
                        className="life-change-animation"
                        style={{
                          position: 'absolute',
                          top: '-1rem',
                          // Position based on positive/negative change
                          ...(lifeChanges[player.id] > 0
                            ? { right: '-1rem' }  // Positive (healing) - top-right
                            : { left: '-1rem' }   // Negative (damage) - top-left
                          ),
                          transform: 'translate(0, 0)',
                          fontSize: '3rem',
                          fontWeight: 'bold',
                          color: lifeChanges[player.id] > 0 ? '#10b981' : '#ef4444',
                          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      >
                        {lifeChanges[player.id] > 0 ? '+' : ''}{lifeChanges[player.id]}
                      </div>
                    )}
                  </div>
                  
                  {/* Left and Right Tap Zones for Life Changes */}
                  {commanderDamageMode === null && (
                    <>
                      {/* Left half - decrease life */}
                      <div
                        onPointerDown={(e) => {
                          if (!isSwipeInProgress) {
                            changeLife(player.id, -1);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!isSwipeInProgress) {
                            changeLife(player.id, -5);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          width: '50%',
                          height: '100%',
                          zIndex: 1,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      />
                      
                      {/* Right half - increase life */}
                      <div
                        onPointerDown={(e) => {
                          if (!isSwipeInProgress) {
                            changeLife(player.id, 1);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!isSwipeInProgress) {
                            changeLife(player.id, 5);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          width: '50%',
                          height: '100%',
                          zIndex: 1,
                          cursor: 'pointer',
                          userSelect: 'none',
                          clipPath: isActive ? 'polygon(0 0, calc(100% - 180px) 0, calc(100% - 180px) 120px, 100% 120px, 100% 100%, 0 100%)' : 'none'
                        }}
                      />
                    </>
                  )}
                  
                  {/* Commander Damage Controls - Show +/- buttons when another player swiped */}
                  {commanderDamageMode !== null && commanderDamageMode !== player.id && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      gap: '1.5rem',
                      zIndex: 10,
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => updateCommanderDamage(commanderDamageMode, player.id, -1)}
                        style={{
                          width: '5rem',
                          height: '5rem',
                          borderRadius: '1rem',
                          backgroundColor: '#ef4444',
                          border: '3px solid rgba(255,255,255,0.9)',
                          color: 'white',
                          fontSize: '3rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseDown={(e) => {
                          e.target.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        -
                      </button>
                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        borderRadius: '1.5rem',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '4rem',
                        border: '3px solid rgba(255,255,255,0.6)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                      }}>
                        <span style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {getCommanderDamageFrom(commanderDamageMode, player.id)}
                        </span>
                      </div>
                      <button
                        onClick={() => updateCommanderDamage(commanderDamageMode, player.id, 1)}
                        style={{
                          width: '5rem',
                          height: '5rem',
                          borderRadius: '1rem',
                          backgroundColor: '#22c55e',
                          border: '3px solid rgba(255,255,255,0.9)',
                          color: 'white',
                          fontSize: '3rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseDown={(e) => {
                          e.target.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* Grey overlay for player in commander damage mode */}
                  {commanderDamageMode === player.id && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 15
                    }}>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '2rem'
                      }}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem',
                          color: 'white',
                          textTransform: 'uppercase'
                        }}>
                          COMMANDER DAMAGE
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          opacity: 0.8,
                          color: 'white'
                        }}>
                          Select opponent cards to track damage
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setCommanderDamageMode(null)}
                        style={{
                          backgroundColor: '#fbbf24',
                          color: '#1f2937',
                          border: 'none',
                          borderRadius: '2rem',
                          padding: '1rem 2rem',
                          fontSize: '1.375rem',
                          fontWeight: '900',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseDown={(e) => {
                          e.target.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        RETURN TO GAME
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Central Settings Button */}
          <div 
            onClick={() => setShowSettingsModal(true)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              backgroundColor: darkMode ? '#1a202c' : '#ffffff',
              border: '3px solid #c0c0c0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 10
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '20px',
                height: '2px',
                backgroundColor: '#ff6b35',
                borderRadius: '1px'
              }}></div>
              <div style={{
                width: '20px',
                height: '2px',
                backgroundColor: '#ff6b35',
                borderRadius: '1px'
              }}></div>
              <div style={{
                width: '20px',
                height: '2px',
                backgroundColor: '#ff6b35',
                borderRadius: '1px'
              }}></div>
            </div>
          </div>
          
          {/* Settings Modal */}
          {showSettingsModal && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20
            }}>
              <div style={{
                backgroundColor: darkMode ? '#1a202c' : '#ffffff',
                borderRadius: '1rem',
                padding: '2rem',
                minWidth: '300px',
                maxWidth: '90vw'
              }}>
                <h3 style={{
                  color: darkMode ? 'white' : '#2d3748',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 'bold'
                }}>
                  Game Settings
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      setShowSettingsModal(false);
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#4a5568' : '#f7fafc',
                      color: darkMode ? 'white' : '#2d3748',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowTimer(!showTimer);
                      setShowSettingsModal(false);
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#4a5568' : '#f7fafc',
                      color: darkMode ? 'white' : '#2d3748',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Clock size={18} />
                      <span>{showTimer ? 'Hide Timer' : 'Show Timer'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setGameState('layout');
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#4a5568' : '#f7fafc',
                      color: darkMode ? 'white' : '#2d3748',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <RotateCw size={18} />
                      <span>Change Layout</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to end this game?')) {
                        endGame();
                        setShowSettingsModal(false);
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <X size={18} />
                      <span>End Game</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      color: darkMode ? '#a0aec0' : '#718096',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render finished game screen
  if (gameState === 'finished') {
    return (
      <GameCompleteScreen
        players={players}
        currentTurn={currentTurn}
        elapsedTime={elapsedTime}
        commanderDamage={commanderDamage}
        darkMode={darkMode}
        onNewGame={() => newGame(false)}
        onQuickRematch={quickRematch}
        onViewStats={viewStats}
      />
    );
  }

  // Render stats screen
  if (gameState === 'stats') {
    return (
      <StatsScreen
        darkMode={darkMode}
        onBack={() => setGameState('finished')}
      />
    );
  }
};

// Main App component with ProfileProvider wrapper
const MTGCommanderTracker = () => {
  return (
    <ProfileProvider>
      <MTGCommanderTrackerInner />
    </ProfileProvider>
  );
};

export default MTGCommanderTracker;
