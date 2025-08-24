import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, Minus, X, RotateCw, Save, Trophy, Skull, Swords, Shuffle, Moon, Sun, Dice6 } from 'lucide-react';

const MTGCommanderTracker = () => {
  // Add CSS for life change animation and MTG-style fonts
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
        font-family: 'Bebas Neue', sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      
      .mtg-text {
        font-family: 'Oswald', sans-serif;
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

  // Game states: 'setup', 'playing', 'finished'
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [commanderDamage, setCommanderDamage] = useState({});
  const [showCommanderDamage, setShowCommanderDamage] = useState(false);
  const [selectedDamageDealer, setSelectedDamageDealer] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [firstPlayerRoll, setFirstPlayerRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lifeChanges, setLifeChanges] = useState({}); // Track recent life changes for animation

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && gameStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, gameStartTime]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add new player
  const addPlayer = () => {
    const newPlayer = {
      id: Date.now(),
      name: `Player ${players.length + 1}`,
      commander: '',
      colors: [],
      life: 40,
      eliminated: false,
      eliminatedTurn: null
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
    if (players.length < 2) return;
    
    setIsRolling(true);
    setFirstPlayerRoll(null);
    
    // Animate rolling effect
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setFirstPlayerRoll(Math.floor(Math.random() * players.length));
      rollCount++;
      
      if (rollCount > 10) {
        clearInterval(rollInterval);
        const finalPlayer = Math.floor(Math.random() * players.length);
        setFirstPlayerRoll(finalPlayer);
        setIsRolling(false);
      }
    }, 100);
  };

  // Start the game
  const startGame = () => {
    if (players.length < 2) {
      alert('Need at least 2 players to start!');
      return;
    }
    
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
      return {
        ...prev,
        [playerId]: currentChange + delta
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
    }, 2000);
  };

  // Update commander damage
  const updateCommanderDamage = (dealerId, receiverId, damage) => {
    const newDamage = { ...commanderDamage };
    newDamage[dealerId][receiverId] = Math.max(0, damage);
    setCommanderDamage(newDamage);
    
    // Check for lethal commander damage (21)
    if (damage >= 21) {
      setPlayers(players.map(p => 
        p.id === receiverId 
          ? { ...p, eliminated: true, eliminatedTurn: currentTurn }
          : p
      ));
    }
  };

  // Next turn
  const nextTurn = () => {
    const activePlayers = players.filter(p => !p.eliminated);
    if (activePlayers.length <= 1) {
      endGame();
      return;
    }
    
    // Find next active player
    let nextIndex = (activePlayerIndex + 1) % players.length;
    while (players[nextIndex].eliminated) {
      nextIndex = (nextIndex + 1) % players.length;
    }
    
    setActivePlayerIndex(nextIndex);
    setCurrentTurn(currentTurn + 1);
  };

  // End the game - THIS IS THE UPDATED VERSION WITH SUPABASE
  const endGame = async () => {
    const winner = players.find(p => !p.eliminated);
    setGameState('finished');
    
    // For now, we'll just console.log the data
    // We'll add Supabase saving in the next step
    const gameData = {
      players: players.map(p => ({
        name: p.name,
        commander: p.commander,
        colors: p.colors,
        finalLife: p.life,
        eliminated: p.eliminated,
        eliminatedTurn: p.eliminatedTurn
      })),
      winner: winner?.name || 'No winner',
      totalTurns: currentTurn,
      duration: elapsedTime,
      commanderDamage: commanderDamage,
      timestamp: new Date().toISOString()
    };
    
    console.log('Game data to save:', gameData);
    // TODO: We'll add Supabase saving here in the next step
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
    setLifeChanges({}); // Clear any life change animations
  };

  // Color options for commanders
  const colorOptions = [
    { code: 'W', name: 'White', color: '#fffbd5' },
    { code: 'U', name: 'Blue', color: '#0e68ab' },
    { code: 'B', name: 'Black', color: '#150b00' },
    { code: 'R', name: 'Red', color: '#d3202a' },
    { code: 'G', name: 'Green', color: '#00733e' }
  ];

  // Generate gradient based on commander colors
  const getPlayerGradient = (colors) => {
    if (!colors || colors.length === 0) {
      // Default gradient if no colors selected
      return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
    
    const colorMap = {
      'W': { from: '#f0e68c', to: '#fffacd' }, // Gold/Light Yellow
      'U': { from: '#4682b4', to: '#87ceeb' }, // Steel Blue/Sky Blue
      'B': { from: '#483d8b', to: '#6a5acd' }, // Dark Slate Blue/Slate Blue
      'R': { from: '#dc143c', to: '#ff6347' }, // Crimson/Tomato
      'G': { from: '#228b22', to: '#32cd32' }  // Forest Green/Lime Green
    };
    
    if (colors.length === 1) {
      const color = colorMap[colors[0]];
      return `bg-gradient-to-br from-[${color.from}] to-[${color.to}]`;
    } else if (colors.length === 2) {
      const color1 = colorMap[colors[0]];
      const color2 = colorMap[colors[1]];
      return `bg-gradient-to-br from-[${color1.from}] to-[${color2.to}]`;
    } else {
      // For 3+ colors, create a more complex gradient
      const firstColor = colorMap[colors[0]];
      const lastColor = colorMap[colors[colors.length - 1]];
      return `bg-gradient-to-br from-[${firstColor.from}] via-purple-500 to-[${lastColor.to}]`;
    }
  };

  // Get inline style for gradient (since Tailwind can't handle dynamic colors)
  const getPlayerGradientStyle = (colors, isActive = false) => {
    if (!colors || colors.length === 0) {
      return {
        background: isActive 
          ? 'linear-gradient(to bottom right, #9333ea, #3b82f6)' 
          : 'linear-gradient(to bottom right, #9ca3af, #6b7280)'
      };
    }
    
    const colorMap = {
      'W': { from: '#f0e68c', to: '#fffacd', active: '#ffd700' },
      'U': { from: '#4682b4', to: '#87ceeb', active: '#1e90ff' },
      'B': { from: '#483d8b', to: '#6a5acd', active: '#4b0082' },
      'R': { from: '#dc143c', to: '#ff6347', active: '#ff0000' },
      'G': { from: '#228b22', to: '#32cd32', active: '#008000' }
    };
    
    if (colors.length === 1) {
      const color = colorMap[colors[0]];
      return {
        background: isActive
          ? `linear-gradient(to bottom right, ${color.active}, ${color.to})`
          : `linear-gradient(to bottom right, ${color.from}, ${color.to})`
      };
    } else if (colors.length === 2) {
      const color1 = colorMap[colors[0]];
      const color2 = colorMap[colors[1]];
      return {
        background: isActive
          ? `linear-gradient(to bottom right, ${color1.active}, ${color2.active})`
          : `linear-gradient(to bottom right, ${color1.from}, ${color2.to})`
      };
    } else {
      // For 3+ colors, create a rainbow-like gradient
      const gradientColors = colors.map(c => colorMap[c]);
      const colorStops = gradientColors.map((c, i) => {
        const percent = (i / (gradientColors.length - 1)) * 100;
        return `${isActive ? c.active : c.from} ${percent}%`;
      }).join(', ');
      
      return {
        background: `linear-gradient(135deg, ${colorStops})`
      };
    }
  };

  const toggleColor = (playerId, colorCode) => {
    const player = players.find(p => p.id === playerId);
    const colors = player.colors || [];
    const newColors = colors.includes(colorCode)
      ? colors.filter(c => c !== colorCode)
      : [...colors, colorCode];
    updatePlayer(playerId, 'colors', newColors);
  };

  // Dark mode styles - MTG themed
  const bgGradient = darkMode 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
    : 'bg-gradient-to-br from-gray-100 via-gray-50 to-white';
  
  const cardBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const cardText = darkMode ? 'text-gray-100' : 'text-gray-900';
  const headerBg = 'mtg-gradient';  // Always use MTG red/orange gradient

  // Render game setup screen
  if (gameState === 'setup') {
    return (
      <div className={`min-h-screen ${bgGradient} p-4`}>
        <div className="max-w-md mx-auto">
          {/* Dark mode toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} shadow-lg`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className={`${cardBg} rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`${headerBg} text-white p-4`}>
              <h1 className="text-2xl font-bold mtg-title tracking-wider">HOTCHI MOTCHI MTG</h1>
              <p className="text-sm opacity-90 mtg-text">Commander Life Tracker</p>
            </div>
            
            <div className={`p-4 space-y-3 ${cardText}`}>
              {players.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 border-2 ${
                    firstPlayerRoll === index 
                      ? 'border-orange-500 shadow-lg shadow-orange-500/50' 
                      : darkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}
                >
                  {firstPlayerRoll === index && (
                    <div className="text-orange-500 text-sm font-bold mb-2 flex items-center gap-1 mtg-text">
                      <Dice6 size={16} />
                      GOES FIRST!
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      className={`font-semibold bg-transparent border-b ${
                        darkMode ? 'border-gray-600 text-gray-100' : 'border-gray-400'
                      } focus:border-orange-500 outline-none mtg-text`}
                      placeholder="Player name"
                    />
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={player.commander}
                    onChange={(e) => updatePlayer(player.id, 'commander', e.target.value)}
                    className={`w-full text-sm ${
                      darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white'
                    } rounded px-2 py-1 border ${
                      darkMode ? 'border-gray-600' : 'border-gray-300'
                    } mb-2 mtg-text`}
                    placeholder="Commander name"
                  />
                  
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.code}
                        onClick={() => toggleColor(player.id, color.code)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          player.colors?.includes(color.code) 
                            ? 'border-black scale-110 shadow-lg' 
                            : 'border-gray-400 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.name}
                      />
                    ))}
                    {player.colors && player.colors.length > 0 && (
                      <div className="ml-2 text-xs text-gray-500 self-center mtg-text">
                        (commander colors)
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {players.length < 4 && (
                <button
                  onClick={addPlayer}
                  className={`w-full py-3 border-2 border-dashed ${
                    darkMode ? 'border-gray-700 text-gray-400 hover:border-orange-600 hover:text-orange-400' 
                    : 'border-gray-400 text-gray-600 hover:border-orange-500 hover:text-orange-600'
                  } rounded-lg transition-colors flex items-center justify-center gap-2 mtg-text font-semibold`}
                >
                  <Plus size={20} />
                  ADD PLAYER {players.length + 1}
                </button>
              )}
              
              {players.length >= 2 && (
                <button
                  onClick={randomizeFirstPlayer}
                  disabled={isRolling}
                  className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 mtg-text tracking-wide ${
                    isRolling 
                      ? 'bg-orange-600 animate-pulse' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Shuffle size={20} className={isRolling ? 'animate-spin' : ''} />
                  {isRolling ? 'ROLLING...' : 'RANDOMIZE FIRST PLAYER'}
                </button>
              )}
              
              <button
                onClick={startGame}
                disabled={players.length < 2}
                className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 mtg-title text-lg tracking-wider ${
                  players.length >= 2 
                    ? 'mtg-gradient hover:opacity-90 shadow-lg' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                START GAME
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render game playing screen
  if (gameState === 'playing') {
    return (
      <div className={`min-h-screen ${bgGradient} p-4`}>
        <div className="max-w-4xl mx-auto">
          {/* Dark mode toggle */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} shadow-lg`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          {/* Header */}
          <div className={`${cardBg} rounded-t-2xl shadow-2xl p-4 flex justify-between items-center border-x border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`flex items-center gap-4 ${cardText}`}>
              <span className="font-bold text-lg mtg-title">TURN {currentTurn}</span>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mtg-text`}>⏱ {formatTime(elapsedTime)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCommanderDamage(!showCommanderDamage)}
                className={`px-3 py-1 ${
                  darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'
                } rounded-lg flex items-center gap-1 mtg-text font-semibold`}
              >
                <Swords size={16} />
                DAMAGE
              </button>
              <button
                onClick={endGame}
                className={`px-3 py-1 ${
                  darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                } rounded-lg mtg-text font-semibold`}
              >
                END GAME
              </button>
            </div>
          </div>
          
          {/* Player Grid */}
          <div className={`${cardBg} shadow-2xl p-4 grid grid-cols-2 gap-4 border-x ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {players.map((player, index) => {
              const isActive = index === activePlayerIndex;
              const shadowColor = player.colors && player.colors.length > 0
                ? player.colors.includes('W') ? 'shadow-yellow-400/50'
                : player.colors.includes('U') ? 'shadow-blue-400/50'
                : player.colors.includes('B') ? 'shadow-purple-600/50'
                : player.colors.includes('R') ? 'shadow-red-500/50'
                : player.colors.includes('G') ? 'shadow-green-500/50'
                : 'shadow-orange-500/50'
                : 'shadow-orange-500/50';
              
              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-4 transition-all relative text-white ${
                    player.eliminated 
                      ? 'opacity-50' 
                      : isActive
                      ? `scale-105 shadow-lg ${shadowColor}`
                      : ''
                  }`}
                  style={
                    player.eliminated
                      ? { background: darkMode ? '#374151' : '#e5e7eb' }
                      : getPlayerGradientStyle(player.colors, isActive)
                  }
                >
                  {isActive && !player.eliminated && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg animate-pulse">
                      ⚔️
                    </div>
                  )}
                  
                  {player.eliminated && (
                    <div className="text-center mb-2">
                      <Skull className="inline-block" size={20} />
                      <span className="ml-2 font-bold mtg-text">ELIMINATED</span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="font-bold text-sm mb-1 drop-shadow-md mtg-text uppercase">{player.name}</div>
                    <div className="text-xs opacity-90 mb-2 drop-shadow-md">{player.commander}</div>
                    
                    <div className="relative">
                      <div className="text-5xl font-bold my-4 drop-shadow-lg mtg-title">{player.life}</div>
                      
                      {/* Life change indicator */}
                      {lifeChanges[player.id] && (
                        <div 
                          className={`absolute -right-4 top-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none ${
                            lifeChanges[player.id] > 0 ? 'text-green-300' : 'text-red-400'
                          } mtg-title`}
                          style={{
                            animation: 'fadeInOut 2s ease-out',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                          }}
                        >
                          {lifeChanges[player.id] > 0 ? '+' : ''}{lifeChanges[player.id]}
                        </div>
                      )}
                    </div>
                    
                    {!player.eliminated && (
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => changeLife(player.id, -1)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            changeLife(player.id, -5);
                          }}
                          className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20"
                        >
                          <Minus size={24} />
                        </button>
                        <button
                          onClick={() => changeLife(player.id, 1)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            changeLife(player.id, 5);
                          }}
                          className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20"
                        >
                          <Plus size={24} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-1 mt-3">
                      {player.colors?.map(color => {
                        const colorData = colorOptions.find(c => c.code === color);
                        return (
                          <div
                            key={color}
                            className="w-5 h-5 rounded-full border-2 border-white/80 shadow-md"
                            style={{ backgroundColor: colorData?.color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Commander Damage Matrix */}
          {showCommanderDamage && (
            <div className={`${cardBg} ${cardText} shadow-2xl p-4 border-x ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="font-bold mb-3 mtg-title text-lg">COMMANDER DAMAGE TRACKER</h3>
              
              {!selectedDamageDealer ? (
                <div className="grid grid-cols-2 gap-2">
                  {players.filter(p => !p.eliminated).map(dealer => (
                    <button
                      key={dealer.id}
                      onClick={() => setSelectedDamageDealer(dealer.id)}
                      className={`p-3 ${
                        darkMode ? 'bg-orange-900 hover:bg-orange-800' : 'bg-orange-100 hover:bg-orange-200'
                      } rounded-lg mtg-text font-semibold`}
                    >
                      {dealer.name}'s Damage →
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedDamageDealer(null)}
                    className={`mb-3 text-sm ${
                      darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                    } mtg-text`}
                  >
                    ← Back
                  </button>
                  
                  <div className="space-y-2">
                    {players.filter(p => p.id !== selectedDamageDealer && !p.eliminated).map(receiver => {
                      const damage = commanderDamage[selectedDamageDealer]?.[receiver.id] || 0;
                      
                      return (
                        <div key={receiver.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24 mtg-text">
                            → {receiver.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCommanderDamage(selectedDamageDealer, receiver.id, damage - 1)}
                              className={`w-8 h-8 ${
                                darkMode ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'
                              } rounded`}
                            >
                              -
                            </button>
                            <span className={`w-12 text-center font-bold mtg-title ${damage >= 21 ? 'text-red-600' : ''}`}>
                              {damage}
                            </span>
                            <button
                              onClick={() => updateCommanderDamage(selectedDamageDealer, receiver.id, damage + 1)}
                              className={`w-8 h-8 ${
                                darkMode ? 'bg-green-900 hover:bg-green-800' : 'bg-green-100 hover:bg-green-200'
                              } rounded`}
                            >
                              +
                            </button>
                            {damage >= 21 && <span className="text-red-600 text-sm font-bold mtg-text">LETHAL!</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Bottom Control Bar */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-800'} rounded-b-2xl shadow-2xl p-4 flex justify-between items-center border-x border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className="text-white font-bold mtg-text">
              {players[activePlayerIndex]?.name}'s Turn
            </span>
            <button
              onClick={nextTurn}
              className="px-4 py-2 mtg-gradient text-white rounded-full font-bold hover:opacity-90 flex items-center gap-2 mtg-text shadow-lg"
            >
              NEXT TURN
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render game finished screen
  if (gameState === 'finished') {
    const winner = players.find(p => !p.eliminated);
    const turnOrder = players
      .filter(p => p.eliminated)
      .sort((a, b) => (b.eliminatedTurn || 0) - (a.eliminatedTurn || 0));
    
    return (
      <div className={`min-h-screen ${bgGradient} p-4`}>
        <div className="max-w-md mx-auto">
          {/* Dark mode toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} shadow-lg`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className={`${cardBg} rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="mtg-gradient text-white p-6 text-center">
              <Trophy className="mx-auto mb-3" size={48} />
              <h1 className="text-2xl font-bold mb-2 mtg-title">GAME COMPLETE!</h1>
              <p className="text-3xl font-bold mtg-title tracking-wider">{winner?.name || 'NO WINNER'} WINS!</p>
            </div>
            
            <div className={`p-6 ${cardText}`}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3 text-center`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mtg-text`}>TOTAL TURNS</div>
                  <div className="text-2xl font-bold mtg-title">{currentTurn}</div>
                </div>
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3 text-center`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mtg-text`}>DURATION</div>
                  <div className="text-2xl font-bold mtg-title">{formatTime(elapsedTime)}</div>
                </div>
              </div>
              
              <h3 className="font-bold mb-3 mtg-title text-lg">FINAL STANDINGS</h3>
              <div className="space-y-2 mb-6">
                {winner && (
                  <div className={`flex items-center gap-3 p-2 ${
                    darkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50'
                  } rounded-lg border ${darkMode ? 'border-yellow-700' : 'border-yellow-400'}`}>
                    <span className="text-2xl">🥇</span>
                    <div>
                      <div className="font-semibold mtg-text">{winner.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {winner.commander}
                      </div>
                    </div>
                  </div>
                )}
                
                {turnOrder.map((player, index) => (
                  <div key={player.id} className={`flex items-center gap-3 p-2 ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-50'
                  } rounded-lg`}>
                    <span className="text-2xl">
                      {index === 0 ? '🥈' : index === 1 ? '🥉' : '💀'}
                    </span>
                    <div>
                      <div className="font-semibold mtg-text">{player.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.commander} • Eliminated turn {player.eliminatedTurn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => newGame(true)}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 flex items-center justify-center gap-2 mtg-text"
                >
                  <Shuffle size={20} />
                  QUICK REMATCH (SAME PLAYERS)
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => newGame(false)}
                    className="flex-1 py-3 mtg-gradient text-white rounded-lg font-bold hover:opacity-90 flex items-center justify-center gap-2 mtg-text shadow-lg"
                  >
                    <RotateCw size={20} />
                    NEW GAME
                  </button>
                  <button
                    onClick={() => console.log('Save to history')}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 mtg-text shadow-lg"
                  >
                    <Save size={20} />
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MTGCommanderTracker;