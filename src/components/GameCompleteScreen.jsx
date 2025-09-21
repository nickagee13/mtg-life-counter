import React, { useState, useEffect } from 'react';
import { Trophy, RotateCw, Plus, Save, Shuffle, Crown } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

const GameCompleteScreen = ({
  players,
  currentTurn,
  elapsedTime,
  commanderDamage,
  darkMode,
  onNewGame,
  onQuickRematch,
  onViewStats
}) => {
  const { currentProfile, getProfileById } = useProfile();

  // Determine winner and final standings
  const alivePlayers = players.filter(p => p.life > 0);
  const eliminatedPlayers = players.filter(p => p.life <= 0);

  // Sort by life total (highest first) for alive players, then by elimination order
  const sortedPlayers = [
    ...alivePlayers.sort((a, b) => b.life - a.life),
    ...eliminatedPlayers.sort((a, b) => (b.eliminatedTurn || 0) - (a.eliminatedTurn || 0))
  ];

  // Assign places
  const finalStandings = sortedPlayers.map((player, index) => ({
    ...player,
    place: index + 1
  }));

  const winner = finalStandings[0];

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate commander damage summary
  const getCommanderDamageSummary = () => {
    const summary = {};
    Object.keys(commanderDamage).forEach(key => {
      const [targetId, dealerId] = key.split('-');
      const damage = commanderDamage[key];
      if (damage > 0) {
        const target = players.find(p => p.id === targetId);
        const dealer = players.find(p => p.id === dealerId);
        if (!summary[dealerId]) {
          summary[dealerId] = { dealer: dealer?.name || 'Unknown', totalDealt: 0 };
        }
        summary[dealerId].totalDealt += damage;
      }
    });
    return Object.values(summary).sort((a, b) => b.totalDealt - a.totalDealt);
  };

  const commanderDamageSummary = getCommanderDamageSummary();

  // Note: Game saving is now handled by App.jsx using saveGameWithProfiles()
  // This component just displays the results

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: darkMode ? '#1a202c' : '#ffffff',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <Trophy size={48} style={{ marginBottom: '1rem' }} />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            GAME COMPLETE!
          </h1>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            margin: '0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            {winner.name.toUpperCase()} WINS!
          </h2>
        </div>

        {/* Game Stats */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: darkMode ? '#a0aec0' : '#718096',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Turns
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {currentTurn}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: darkMode ? '#a0aec0' : '#718096',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Duration
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        {/* Final Standings */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: darkMode ? '#e2e8f0' : '#2d3748',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.025em'
          }}>
            Final Standings
          </h3>

          {finalStandings.map((player, index) => (
            <div key={player.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              marginBottom: '0.75rem',
              backgroundColor: index === 0
                ? 'rgba(251, 191, 36, 0.1)'
                : darkMode ? '#4a5568' : '#f7fafc',
              border: index === 0
                ? '2px solid #fbbf24'
                : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? '#fbbf24' : darkMode ? '#718096' : '#a0aec0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.125rem'
                }}>
                  {index === 0 ? <Crown size={16} /> : player.place}
                </div>
                <div>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    color: darkMode ? '#e2e8f0' : '#2d3748'
                  }}>
                    {player.name}
                  </div>
                  {player.commander && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: darkMode ? '#a0aec0' : '#718096'
                    }}>
                      {player.commander}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: player.life > 0
                  ? '#10b981'
                  : '#ef4444'
              }}>
                {player.life} ♥
              </div>
            </div>
          ))}
        </div>

        {/* Commander Damage Summary */}
        {commanderDamageSummary.length > 0 && (
          <div style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              marginBottom: '0.75rem'
            }}>
              Commander Damage Leaders
            </h3>
            {commanderDamageSummary.slice(0, 3).map((summary, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                color: darkMode ? '#e2e8f0' : '#2d3748'
              }}>
                <span>{summary.dealer}</span>
                <span style={{ fontWeight: 'bold', color: '#ff6b35' }}>
                  {summary.totalDealt} damage
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Save Status */}
          <div style={{
            textAlign: 'center',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: '#10b981'
          }}>
            ✅ Game saved successfully!
          </div>

          {/* Quick Rematch */}
          <button
            onClick={onQuickRematch}
            style={{
              padding: '1rem',
              backgroundColor: darkMode ? '#4a5568' : '#2d3748',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.target.style.backgroundColor = darkMode ? '#718096' : '#4a5568'}
            onMouseLeave={e => e.target.style.backgroundColor = darkMode ? '#4a5568' : '#2d3748'}
          >
            <Shuffle size={20} />
            QUICK REMATCH (SAME PLAYERS)
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* New Game */}
            <button
              onClick={onNewGame}
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCw size={18} />
              NEW GAME
            </button>

            {/* View Stats */}
            <button
              onClick={onViewStats}
              style={{
                padding: '1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={18} />
              VIEW STATS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCompleteScreen;