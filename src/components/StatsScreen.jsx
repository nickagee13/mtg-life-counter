import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Trophy, TrendingUp, Crown, Palette, Award } from 'lucide-react';
import { gameQueries } from '../lib/supabase-queries';
import { useProfile } from '../contexts/ProfileContext';

const StatsScreen = ({ darkMode, onBack }) => {
  const { currentProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stats data
  useEffect(() => {
    if (currentProfile && !currentProfile.isGuest) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [currentProfile]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileStats = await gameQueries.getProfileStats(currentProfile.id);
      setStats(profileStats);
      setRecentGames(profileStats.recentGames);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get place suffix
  const getPlaceSuffix = (place) => {
    if (place === 1) return 'st';
    if (place === 2) return 'nd';
    if (place === 3) return 'rd';
    return 'th';
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'commander', label: 'By Commander', icon: Crown },
    { id: 'colors', label: 'By Colors', icon: Palette },
    { id: 'records', label: 'Records', icon: Award }
  ];

  if (currentProfile?.isGuest) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                cursor: 'pointer',
                padding: '0.5rem',
                marginRight: '1rem'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Stats & History
            </h1>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#1a202c' : '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <Trophy size={48} style={{
              margin: '0 auto 1rem auto',
              color: darkMode ? '#a0aec0' : '#718096'
            }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              marginBottom: '0.5rem'
            }}>
              Guest Mode
            </h2>
            <p style={{
              color: darkMode ? '#a0aec0' : '#718096',
              marginBottom: '1.5rem'
            }}>
              Create a profile to track your game statistics and history.
            </p>
            <button
              onClick={onBack}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                cursor: 'pointer',
                padding: '0.5rem',
                marginRight: '1rem'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Stats & History
            </h1>
          </div>
          <Settings size={20} style={{ color: darkMode ? '#a0aec0' : '#718096' }} />
        </div>

        {/* Profile Info */}
        {currentProfile && (
          <div style={{
            backgroundColor: darkMode ? '#1a202c' : '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              marginBottom: '0.5rem'
            }}>
              {currentProfile.display_name}
            </h2>
            <p style={{
              color: darkMode ? '#a0aec0' : '#718096',
              fontSize: '0.875rem'
            }}>
              @{currentProfile.username}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          backgroundColor: darkMode ? '#1a202c' : '#ffffff',
          borderRadius: '1rem',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            padding: '1.5rem 1.5rem 0 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto'
            }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem 0.5rem 0 0',
                      border: 'none',
                      backgroundColor: isActive ? (darkMode ? '#1a202c' : '#ffffff') : 'transparent',
                      color: isActive ? (darkMode ? '#e2e8f0' : '#2d3748') : 'rgba(255,255,255,0.7)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 'bold' : 'normal',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                color: darkMode ? '#a0aec0' : '#718096',
                padding: '2rem'
              }}>
                Loading statistics...
              </div>
            ) : error ? (
              <div style={{
                textAlign: 'center',
                color: '#ef4444',
                padding: '2rem'
              }}>
                {error}
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                  <div>
                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div style={{
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: darkMode ? '#a0aec0' : '#718096',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase'
                        }}>
                          Total Games
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: darkMode ? '#e2e8f0' : '#2d3748'
                        }}>
                          {stats.totalGames}
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: darkMode ? '#a0aec0' : '#718096',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase'
                        }}>
                          Win Rate
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: '#10b981'
                        }}>
                          {stats.winRate}%
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: darkMode ? '#a0aec0' : '#718096',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase'
                        }}>
                          Avg Duration
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: darkMode ? '#e2e8f0' : '#2d3748'
                        }}>
                          {formatTime(stats.avgDuration)}
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: darkMode ? '#a0aec0' : '#718096',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase'
                        }}>
                          Avg Turns
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: darkMode ? '#e2e8f0' : '#2d3748'
                        }}>
                          {stats.avgTurns}
                        </div>
                      </div>
                    </div>

                    {/* Recent Games */}
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      marginBottom: '1rem'
                    }}>
                      Recent Games
                    </h3>

                    {recentGames.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentGames.map((game, index) => (
                          <div key={index} style={{
                            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem'
                              }}>
                                {game.place === 1 && <Trophy size={16} color="#fbbf24" />}
                                <span style={{
                                  fontWeight: 'bold',
                                  color: game.place === 1 ? '#fbbf24' : darkMode ? '#e2e8f0' : '#2d3748'
                                }}>
                                  {game.place === 1 ? 'Win' : `${game.place}${getPlaceSuffix(game.place)} place`}
                                </span>
                              </div>
                              {game.commander && (
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: darkMode ? '#a0aec0' : '#718096'
                                }}>
                                  {game.commander}
                                </div>
                              )}
                            </div>
                            <div style={{
                              textAlign: 'right',
                              fontSize: '0.75rem',
                              color: darkMode ? '#a0aec0' : '#718096'
                            }}>
                              <div>{game.turns} turns • {formatTime(game.duration)}</div>
                              <div>{formatDate(game.date)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: darkMode ? '#a0aec0' : '#718096',
                        padding: '2rem'
                      }}>
                        No games recorded yet. Play some games to see your statistics!
                      </div>
                    )}
                  </div>
                )}

                {/* Commander Tab */}
                {activeTab === 'commander' && stats && (
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      marginBottom: '1rem'
                    }}>
                      Commander Performance
                    </h3>

                    {Object.keys(stats.commanderStats).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(stats.commanderStats)
                          .sort(([,a], [,b]) => b.games - a.games)
                          .map(([commander, commanderData]) => {
                            const winRate = commanderData.games > 0
                              ? Math.round((commanderData.wins / commanderData.games) * 100)
                              : 0;

                            return (
                              <div key={commander} style={{
                                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                                borderRadius: '0.5rem',
                                padding: '1rem'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{
                                    fontWeight: 'bold',
                                    color: darkMode ? '#e2e8f0' : '#2d3748'
                                  }}>
                                    {commander}
                                  </span>
                                  <span style={{
                                    fontSize: '0.875rem',
                                    color: winRate >= 50 ? '#10b981' : darkMode ? '#a0aec0' : '#718096'
                                  }}>
                                    {winRate}% win rate
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: darkMode ? '#a0aec0' : '#718096'
                                }}>
                                  {commanderData.wins} wins • {commanderData.games} games
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: darkMode ? '#a0aec0' : '#718096',
                        padding: '2rem'
                      }}>
                        No commander data available yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && stats && (
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      marginBottom: '1rem'
                    }}>
                      Color Performance
                    </h3>

                    {Object.keys(stats.colorStats).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(stats.colorStats)
                          .sort(([,a], [,b]) => b.games - a.games)
                          .map(([colors, colorData]) => {
                            const winRate = colorData.games > 0
                              ? Math.round((colorData.wins / colorData.games) * 100)
                              : 0;

                            return (
                              <div key={colors} style={{
                                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                                borderRadius: '0.5rem',
                                padding: '1rem'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '0.5rem'
                                }}>
                                  <span style={{
                                    fontWeight: 'bold',
                                    color: darkMode ? '#e2e8f0' : '#2d3748'
                                  }}>
                                    {colors || 'Colorless'}
                                  </span>
                                  <span style={{
                                    fontSize: '0.875rem',
                                    color: winRate >= 50 ? '#10b981' : darkMode ? '#a0aec0' : '#718096'
                                  }}>
                                    {winRate}% win rate
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: darkMode ? '#a0aec0' : '#718096'
                                }}>
                                  {colorData.wins} wins • {colorData.games} games
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: darkMode ? '#a0aec0' : '#718096',
                        padding: '2rem'
                      }}>
                        No color data available yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Records Tab */}
                {activeTab === 'records' && (
                  <div style={{
                    textAlign: 'center',
                    color: darkMode ? '#a0aec0' : '#718096',
                    padding: '2rem'
                  }}>
                    <Award size={48} style={{ margin: '0 auto 1rem auto' }} />
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      Records & Achievements
                    </h3>
                    <p>Coming soon! This will show your fastest wins, longest games, and special achievements.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;