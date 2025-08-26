import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, X, RotateCw, Save, Trophy, Skull, Swords, Shuffle, Moon, Sun, Dice6 } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

// Import mana color images
import whiteImage from './assets/images/white.jpeg';
import blueImage from './assets/images/blue.jpeg';
import blackImage from './assets/images/black.jpeg';
import redImage from './assets/images/red.png';
import greenImage from './assets/images/green.png';

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
  const [darkMode, setDarkMode] = useState(true);
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
    if (players.length < 1) return;
    
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
    if (players.length < 1) {
      alert('Need at least 1 player to start!');
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

  // End the game and save to Supabase
const endGame = async () => {
  const winner = players.find(p => !p.eliminated);
  setGameState('finished');
  
  try {
    // Save game to Supabase
    const gameData = {
      winner: winner?.name || 'No winner',
      total_turns: currentTurn,
      duration_seconds: elapsedTime,
      commander_damage: commanderDamage
    };
    
    console.log('Saving game data:', gameData);
    
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();
    
    if (gameError) {
      console.error('Error saving game:', gameError);
      throw gameError;
    }
    
    console.log('Game saved with ID:', game.id);
    
    // Save all players for this game
    const playersData = players.map(p => ({
      game_id: game.id,
      name: p.name,
      commander: p.commander,
      colors: p.colors || [],
      final_life: p.life,
      eliminated: p.eliminated,
      eliminated_turn: p.eliminatedTurn
    }));
    
    console.log('Saving players data:', playersData);
    
    const { error: playersError } = await supabase
      .from('players')
      .insert(playersData);
    
    if (playersError) {
      console.error('Error saving players:', playersError);
      throw playersError;
    }
    
    console.log('✅ Game and players saved successfully!');
    
  } catch (error) {
    console.error('❌ Error saving game:', error.message);
    alert('Game finished, but there was an error saving to database. Check console for details.');
    // Game still ends even if save fails
  }
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

  // Updated styles to match mockup - dark navy background
  const containerBg = 'bg-slate-800'; // Slightly lighter for containers
  const cardText = 'text-white'; // Always white text for contrast

  // Render game setup screen
  if (gameState === 'setup') {
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
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(45, 55, 72, 0.1)',
                border: `2px solid ${darkMode ? '#ffc107' : '#2d3748'}`,
                color: darkMode ? '#ffc107' : '#2d3748',
                cursor: 'pointer'
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
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
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <img 
                src="/hotchi-motchi-logo.png" 
                alt="Hotchi Motchi" 
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.target.style.display = 'none';
                }}
                onLoad={(e) => {
                  console.log('Logo loaded successfully');
                }}
                style={{ 
                  height: '12rem', 
                  objectFit: 'contain',
                  margin: '0 auto 0.25rem auto',
                  display: 'block'
                }} 
              />
              <h1 style={{ 
                fontSize: '2.25rem', 
                fontWeight: 'bold', 
                margin: '0',
                letterSpacing: '0.05em',
                fontFamily: "'Windsor BT', serif",
                color: 'black'
              }}>
                LIFE TRACKER
              </h1>
            </div>
            
            {/* Player setup area */}
            <div style={{
              backgroundColor: darkMode ? '#1a202c' : '#ffffff',
              padding: '1.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {players.map((player, index) => (
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
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: '600',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        outline: 'none',
                        paddingBottom: '0.25rem',
                        fontFamily: "'Windsor BT', serif"
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
                  
                  <input
                    type="text"
                    value={player.commander}
                    onChange={(e) => updatePlayer(player.id, 'commander', e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: '0.875rem',
                      backgroundColor: darkMode ? '#1a202c' : '#edf2f7',
                      color: darkMode ? '#cbd5e0' : '#4a5568',
                      border: `1px solid ${darkMode ? '#2d3748' : '#e2e8f0'}`,
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      marginBottom: '0.75rem',
                      outline: 'none'
                    }}
                    placeholder="Commander name"
                  />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: darkMode ? '#a0aec0' : '#718096',
                      marginLeft: '0.5rem'
                    }}>
                      (card color)
                    </span>
                  </div>
                </div>
              ))}
              
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
                  ADD PLAYER {players.length + 1}
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
        padding: '1rem' 
      }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          {/* Dark mode toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(45, 55, 72, 0.1)',
                border: `2px solid ${darkMode ? '#ffc107' : '#2d3748'}`,
                color: darkMode ? '#ffc107' : '#2d3748',
                cursor: 'pointer'
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          {/* Header */}
          <div style={{ 
            backgroundColor: darkMode ? '#1a202c' : 'white',
            borderRadius: '1rem 1rem 0 0',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: darkMode ? 'white' : '#2d3748',
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                fontFamily: "'Windsor BT', serif"
              }}>TURN {currentTurn}</span>
              <span style={{ color: darkMode ? '#a0aec0' : '#718096' }}>⏱ {formatTime(elapsedTime)}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowCommanderDamage(!showCommanderDamage)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: darkMode ? 'rgba(255, 107, 53, 0.9)' : 'rgba(255, 107, 53, 0.1)',
                  color: darkMode ? 'white' : '#ff6b35',
                  border: darkMode ? 'none' : '1px solid #ff6b35',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <Swords size={14} />
                DAMAGE
              </button>
              <button
                onClick={endGame}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: darkMode ? 'rgba(229, 62, 62, 0.9)' : 'rgba(229, 62, 62, 0.1)',
                  color: darkMode ? 'white' : '#e53e3e',
                  border: darkMode ? 'none' : '1px solid #e53e3e',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                END GAME
              </button>
            </div>
          </div>
          
          {/* Player Grid */}
          <div style={{ 
            backgroundColor: darkMode ? '#1a202c' : 'white',
            padding: '1rem',
            display: 'flex',
            gap: '1rem',
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {players.map((player, index) => {
              const isActive = index === activePlayerIndex;
              
              // Original gradients from screenshots
              const getOriginalGradient = (playerIndex, playerName) => {
                // Check if this is Nick (yellow-blue gradient) or Gino (green gradient)
                if (playerName.toLowerCase().includes('nick')) {
                  return 'linear-gradient(135deg, #fbbf24 0%, #3b82f6 100%)'; // Yellow to Blue
                } else {
                  return 'linear-gradient(135deg, #10b981 0%, #059669 50%, #1e40af 100%)'; // Green gradient
                }
              };
              
              return (
                <div
                  key={player.id}
                  style={{
                    flex: '1 1 0%',
                    borderRadius: '1rem',
                    padding: '2rem 1.5rem',
                    position: 'relative',
                    color: 'white',
                    background: getOriginalGradient(index, player.name),
                    opacity: player.eliminated ? 0.6 : 1,
                    minHeight: '12rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {/* Active player indicator */}
                  {isActive && !player.eliminated && (
                    <div style={{
                      position: 'absolute',
                      top: '-0.5rem',
                      right: '-0.5rem',
                      backgroundColor: '#ff6b35',
                      color: 'white',
                      borderRadius: '50%',
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                      <X size={18} />
                    </div>
                  )}
                  
                  {player.eliminated && (
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <Skull size={24} style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>ELIMINATED</div>
                    </div>
                  )}
                  
                  {/* Player name */}
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.25rem', 
                    marginBottom: '1rem', 
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    {player.name}
                  </div>
                  
                  {/* Life total */}
                  <div style={{ 
                    fontSize: '4.5rem', 
                    fontWeight: 'bold', 
                    lineHeight: '1',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    {player.life}
                    
                    {/* Life change indicator */}
                    {lifeChanges[player.id] && (
                      <div 
                        style={{
                          position: 'absolute',
                          right: '-2rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          pointerEvents: 'none',
                          color: lifeChanges[player.id] > 0 ? '#10b981' : '#ef4444',
                          animation: 'fadeInOut 2s ease-out',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {lifeChanges[player.id] > 0 ? '+' : ''}{lifeChanges[player.id]}
                      </div>
                    )}
                  </div>
                  
                  {/* +/- Buttons */}
                  {!player.eliminated && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <button
                        onClick={() => changeLife(player.id, -1)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          changeLife(player.id, -5);
                        }}
                        style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => changeLife(player.id, 1)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          changeLife(player.id, 5);
                        }}
                        style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                  
                  {/* Mana color indicators */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                    {player.colors?.map(color => {
                      const colorData = colorOptions.find(c => c.code === color);
                      return (
                        <div
                          key={color}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            backgroundImage: `url(${colorData?.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid rgba(255, 255, 255, 0.7)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Commander Damage Matrix */}
          {showCommanderDamage && (
            <div className={`${containerBg} ${cardText} shadow-2xl p-4`}>
              <h3 className="font-bold mb-3 text-lg">COMMANDER DAMAGE TRACKER</h3>
              
              {!selectedDamageDealer ? (
                <div className="grid grid-cols-2 gap-2">
                  {players.filter(p => !p.eliminated).map(dealer => (
                    <button
                      key={dealer.id}
                      onClick={() => setSelectedDamageDealer(dealer.id)}
                      className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold"
                    >
                      {dealer.name}'s Damage →
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedDamageDealer(null)}
                    className="mb-3 text-sm text-gray-300 hover:text-white"
                  >
                    ← Back
                  </button>
                  
                  <div className="space-y-2">
                    {players.filter(p => p.id !== selectedDamageDealer && !p.eliminated).map(receiver => {
                      const damage = commanderDamage[selectedDamageDealer]?.[receiver.id] || 0;
                      
                      return (
                        <div key={receiver.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24">
                            → {receiver.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCommanderDamage(selectedDamageDealer, receiver.id, damage - 1)}
                              className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded text-white"
                            >
                              -
                            </button>
                            <span className={`w-12 text-center font-bold ${damage >= 21 ? 'text-red-400' : 'text-white'}`}>
                              {damage}
                            </span>
                            <button
                              onClick={() => updateCommanderDamage(selectedDamageDealer, receiver.id, damage + 1)}
                              className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded text-white"
                            >
                              +
                            </button>
                            {damage >= 21 && <span className="text-red-400 text-sm font-bold">LETHAL!</span>}
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
          <div style={{ 
            backgroundColor: darkMode ? '#2d3748' : '#2d3748',
            borderRadius: '0 0 1rem 1rem',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <span style={{ 
              fontWeight: '600', 
              fontSize: '1.125rem',
              fontFamily: "'Windsor BT', serif"
            }}>
              {players.length === 1 ? `${players[0]?.name}'s Game` : `${players[activePlayerIndex]?.name}'s Turn`}
            </span>
            <button
              onClick={nextTurn}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                color: 'white',
                borderRadius: '2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px 0 rgba(255, 107, 53, 0.39)'
              }}
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
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(45, 55, 72, 0.1)',
                border: `2px solid ${darkMode ? '#ffc107' : '#2d3748'}`,
                color: darkMode ? '#ffc107' : '#2d3748',
                cursor: 'pointer'
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
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
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Trophy size={48} style={{ marginBottom: '0.75rem', marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                margin: '0 0 0.5rem 0',
                letterSpacing: '0.05em',
                fontFamily: "'Windsor BT', serif",
                color: 'white'
              }}>
                GAME COMPLETE!
              </h1>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold',
                margin: 0,
                letterSpacing: '0.1em',
                fontFamily: "'Windsor BT', serif",
                color: 'white'
              }}>
                {winner?.name || 'NO WINNER'} WINS!
              </p>
            </div>
            
            {/* Content area */}
            <div style={{
              backgroundColor: darkMode ? '#1a202c' : '#ffffff',
              padding: '1.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: darkMode ? '#a0aec0' : '#718096',
                    marginBottom: '0.25rem',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    TOTAL TURNS
                  </div>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    {currentTurn}
                  </div>
                </div>
                <div style={{
                  backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: darkMode ? '#a0aec0' : '#718096',
                    marginBottom: '0.25rem',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    DURATION
                  </div>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    fontFamily: "'Windsor BT', serif"
                  }}>
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>
              
              {/* Final standings */}
              <h3 style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.75rem',
                fontSize: '1.125rem',
                fontFamily: "'Windsor BT', serif"
              }}>
                FINAL STANDINGS
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                {winner && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                    borderRadius: '0.5rem',
                    border: `2px solid ${darkMode ? '#f59e0b' : '#f59e0b'}`
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <div style={{ fontWeight: '600', fontFamily: "'Windsor BT', serif" }}>
                      {winner.name}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Button section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Quick rematch button */}
                <button
                  onClick={() => newGame(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: darkMode ? '#4a5568' : '#4a5568',
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Windsor BT', serif"
                  }}
                >
                  <Shuffle size={18} />
                  QUICK REMATCH (SAME PLAYERS)
                </button>
                
                {/* Bottom two buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => newGame(false)}
                    style={{
                      flex: '1',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Windsor BT', serif"
                    }}
                  >
                    <RotateCw size={18} />
                    NEW GAME
                  </button>
                  <button
                    onClick={() => console.log('Save to history')}
                    style={{
                      flex: '1',
                      padding: '0.75rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Windsor BT', serif"
                    }}
                  >
                    <Save size={18} />
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