import React, { useState, useEffect } from 'react';
import {
  Trophy, Target, Clock, TrendingUp, Award, BarChart3,
  Swords, Palette, Calendar, ChevronRight, User, Share2
} from 'lucide-react';
import { getProfileStats } from '../../lib/profiles/profileService';
import {
  formatDuration,
  getColorCombinationName,
  calculateStreaks,
  calculateTrends,
  getAchievements
} from '../../lib/profiles/statsCalculator';
import { formatShareCode } from '../../lib/profiles/codeGenerator';

const ProfileStats = ({ profileId, profile, darkMode = true, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, [profileId]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const profileStats = await getProfileStats(profileId);
      setStats(profileStats);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!stats || !stats.summary) return null;

    const { summary, recentGames } = stats;
    const streaks = calculateStreaks(recentGames);
    const trends = calculateTrends(recentGames);
    const achievements = getAchievements(summary);

    return (
      <div>
        {/* Main Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Trophy size={16} color="#f59e0b" />
              <span style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                textTransform: 'uppercase'
              }}>
                Games Won
              </span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {summary.wins}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: darkMode ? '#a0aec0' : '#718096'
            }}>
              of {summary.totalGames} games
            </div>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Target size={16} color="#10b981" />
              <span style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                textTransform: 'uppercase'
              }}>
                Win Rate
              </span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {summary.winRate}%
            </div>
            {trends.improving && (
              <div style={{
                fontSize: '0.875rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <TrendingUp size={14} />
                {trends.trend}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Clock size={16} color="#3b82f6" />
              <span style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                textTransform: 'uppercase'
              }}>
                Avg Duration
              </span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {formatDuration(summary.avgDuration * 60)}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: darkMode ? '#a0aec0' : '#718096'
            }}>
              ~{summary.avgTurns} turns
            </div>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Award size={16} color="#8b5cf6" />
              <span style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                textTransform: 'uppercase'
              }}>
                Avg Place
              </span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {summary.avgPlacement.toFixed(1)}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: darkMode ? '#a0aec0' : '#718096'
            }}>
              position
            </div>
          </div>
        </div>

        {/* Streaks */}
        {streaks.currentStreak > 0 && (
          <div style={{
            backgroundColor: streaks.streakType === 'win'
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${streaks.streakType === 'win' ? '#22c55e' : '#ef4444'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: streaks.streakType === 'win' ? '#22c55e' : '#ef4444',
              marginBottom: '0.25rem'
            }}>
              Current {streaks.streakType === 'win' ? 'Win' : 'Loss'} Streak
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              {streaks.currentStreak} {streaks.currentStreak === 1 ? 'game' : 'games'}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Achievements
            </h4>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  style={{
                    backgroundColor: darkMode ? '#4a5568' : '#edf2f7',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  title={achievement.description}
                >
                  <span>{achievement.icon}</span>
                  <span style={{ color: darkMode ? '#e2e8f0' : '#2d3748' }}>
                    {achievement.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games */}
        {recentGames && recentGames.length > 0 && (
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Recent Games
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {recentGames.slice(0, 5).map((game, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: game.placement === 1
                        ? '#f59e0b'
                        : (darkMode ? '#4a5568' : '#cbd5e0'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: game.placement === 1 ? 'white' : (darkMode ? '#e2e8f0' : '#718096'),
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {game.placement}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        fontSize: '0.875rem'
                      }}>
                        {game.commander_name || 'Unknown Commander'}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: darkMode ? '#a0aec0' : '#718096'
                      }}>
                        {game.total_turns} turns • {formatDuration(game.duration)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: darkMode ? '#a0aec0' : '#718096'
                  }}>
                    {new Date(game.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommanders = () => {
    if (!stats || !stats.commanderStats) return null;

    const commanders = Object.entries(stats.commanderStats)
      .sort((a, b) => b[1].games - a[1].games);

    if (commanders.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: darkMode ? '#a0aec0' : '#718096'
        }}>
          <Swords size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p>No commander data available yet</p>
        </div>
      );
    }

    return (
      <div>
        {commanders.map(([name, data]) => (
          <div
            key={name}
            style={{
              backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              marginBottom: '1rem'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.75rem'
            }}>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  color: darkMode ? '#e2e8f0' : '#2d3748',
                  marginBottom: '0.25rem'
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: darkMode ? '#a0aec0' : '#718096'
                }}>
                  {data.colors && data.colors.length > 0 && (
                    <span>{getColorCombinationName(data.colors)}</span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: data.winRate >= 50
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '0.25rem'
              }}>
                <Trophy size={14} color={data.winRate >= 50 ? '#22c55e' : '#ef4444'} />
                <span style={{
                  fontWeight: 'bold',
                  color: data.winRate >= 50 ? '#22c55e' : '#ef4444'
                }}>
                  {data.winRate}%
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              fontSize: '0.75rem'
            }}>
              <div>
                <div style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Games</div>
                <div style={{
                  fontWeight: 'bold',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}>
                  {data.games}
                </div>
              </div>
              <div>
                <div style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Wins</div>
                <div style={{
                  fontWeight: 'bold',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}>
                  {data.wins}
                </div>
              </div>
              <div>
                <div style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Avg Place</div>
                <div style={{
                  fontWeight: 'bold',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}>
                  {data.avgPlacement}
                </div>
              </div>
              <div>
                <div style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Avg DMG</div>
                <div style={{
                  fontWeight: 'bold',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}>
                  {data.avgDamage}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderColors = () => {
    if (!stats || !stats.colorStats) return null;

    const colors = Object.entries(stats.colorStats)
      .sort((a, b) => b[1].games - a[1].games);

    if (colors.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: darkMode ? '#a0aec0' : '#718096'
        }}>
          <Palette size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p>No color data available yet</p>
        </div>
      );
    }

    return (
      <div>
        {colors.map(([colorKey, data]) => (
          <div
            key={colorKey}
            style={{
              backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{
                fontWeight: 'bold',
                fontSize: '1rem',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                marginBottom: '0.25rem'
              }}>
                {data.displayName}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                {data.games} games • {data.wins} wins
              </div>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: data.winRate >= 50 ? '#22c55e' : (darkMode ? '#e2e8f0' : '#2d3748')
            }}>
              {data.winRate}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white',
        padding: '1.5rem'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {profile?.display_name || 'Profile'} Stats
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              opacity: 0.9
            }}>
              {profile?.username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={14} />
                  @{profile.username}
                </div>
              )}
              {profile?.share_code && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Share2 size={14} />
                  {formatShareCode(profile.share_code)}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: darkMode ? '#1a202c' : '#f9fafb',
        borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          gap: '1rem',
          padding: '0 1.5rem'
        }}>
          {['overview', 'commanders', 'colors'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #8b5cf6' : 'none',
                color: activeTab === tab
                  ? '#8b5cf6'
                  : (darkMode ? '#a0aec0' : '#718096'),
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: darkMode ? '#0f172a' : '#ffffff'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: darkMode ? '#a0aec0' : '#718096'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #8b5cf6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }} />
              Loading statistics...
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#ef4444'
            }}>
              {error}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'commanders' && renderCommanders()}
              {activeTab === 'colors' && renderColors()}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfileStats;