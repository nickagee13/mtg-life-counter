import React, { useState, useEffect } from 'react';
import {
  User, UserPlus, UserCheck, Hash, Trophy, ChevronDown, X, Search
} from 'lucide-react';
import { getMyProfileId, getRecentPlayers } from '../../lib/profiles/localStorage';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileQuickAdd from './ProfileQuickAdd';

// Import mana symbol images
import whiteIcon from '../../assets/images/white.jpeg';
import blueIcon from '../../assets/images/blue.jpeg';
import blackIcon from '../../assets/images/black.jpeg';
import redIcon from '../../assets/images/red.png';
import greenIcon from '../../assets/images/green.png';

const PlayerSlot = ({
  index,
  player,
  onUpdate,
  onRemove,
  existingProfiles = [],
  darkMode = true,
  showCommander = true,
  searchResults = [],
  searchLoading = false,
  onSearchCommanders
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [showCommanderSuggestions, setShowCommanderSuggestions] = useState(false);

  const { currentProfile } = useProfile();

  useEffect(() => {
    // Load recent players
    const recent = getRecentPlayers();
    setRecentPlayers(recent);
  }, []);

  const handleSelectProfile = (profile) => {
    onUpdate({
      ...player,
      profile: profile,
      profile_id: profile.id,
      name: profile.display_name,
      isGuest: false
    });
    setShowOptions(false);
  };

  const handleGuestMode = () => {
    onUpdate({
      ...player,
      profile: null,
      profile_id: null,
      isGuest: true
    });
    setShowOptions(false);
  };

  const handleRemoveProfile = () => {
    onUpdate({
      ...player,
      profile: null,
      profile_id: null,
      name: player.originalName || `Player ${index + 1}`,
      isGuest: true
    });
  };

  const filteredRecentPlayers = recentPlayers.filter(p => {
    // Filter out already added profiles
    if (existingProfiles.some(existing => existing.id === p.id)) {
      return false;
    }
    // Filter by search
    if (searchValue) {
      const search = searchValue.toLowerCase();
      return (
        p.display_name.toLowerCase().includes(search) ||
        p.username.toLowerCase().includes(search) ||
        (p.share_code && p.share_code.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const hasProfile = player.profile && !player.isGuest;

  return (
    <div style={{
      backgroundColor: darkMode ? '#2d3748' : '#ffffff',
      border: hasProfile
        ? '2px solid #8b5cf6'
        : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '1rem',
      position: 'relative'
    }}>
      {/* Player Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: showCommander ? '0.75rem' : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Player Number */}
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: hasProfile ? '#8b5cf6' : (darkMode ? '#4a5568' : '#cbd5e0'),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}>
            {index + 1}
          </div>

          {/* Player Name and Profile */}
          <div>
            <div style={{
              fontWeight: 'bold',
              fontSize: '1.125rem',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {player.name || `Player ${index + 1}`}
              {hasProfile && (
                <UserCheck size={16} color="#8b5cf6" />
              )}
            </div>
            {hasProfile && (
              <div style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>@{player.profile.username}</span>
                {player.profile.share_code && (
                  <>
                    <span>•</span>
                    <Hash size={10} />
                    <span>{player.profile.share_code}</span>
                  </>
                )}
                {player.profile.games_played > 0 && (
                  <>
                    <span>•</span>
                    <Trophy size={10} />
                    <span>{player.profile.win_rate || 0}%</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasProfile ? (
            <button
              onClick={handleRemoveProfile}
              style={{
                padding: '0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: darkMode ? '#a0aec0' : '#718096',
                cursor: 'pointer',
                borderRadius: '0.25rem'
              }}
              title="Remove profile"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={() => setShowOptions(!showOptions)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                border: 'none',
                borderRadius: '0.5rem',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <UserPlus size={16} />
              Add Profile
              <ChevronDown size={14} />
            </button>
          )}

          {onRemove && (
            <button
              onClick={onRemove}
              style={{
                padding: '0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                borderRadius: '0.25rem'
              }}
              title="Remove player"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Commander Section */}
      {showCommander && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={player.commander || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdate({ ...player, commander: value });

                  // Trigger search as user types
                  if (onSearchCommanders) {
                    onSearchCommanders(value);
                  }

                  // Show suggestions if there's input
                  setShowCommanderSuggestions(value.length >= 2);
                }}
                onFocus={() => {
                  if (player.commander && player.commander.length >= 2) {
                    setShowCommanderSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Hide suggestions after a delay to allow clicking
                  setTimeout(() => setShowCommanderSuggestions(false), 200);
                }}
                placeholder="Commander name..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: darkMode ? '#1a202c' : '#f7fafc',
                  border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  color: darkMode ? '#e2e8f0' : '#2d3748',
                  fontSize: '0.875rem'
                }}
              />

              {/* Commander Suggestions Dropdown */}
              {showCommanderSuggestions && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: darkMode ? '#1a202c' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 200,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {searchResults.map((commander, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onUpdate({
                          ...player,
                          commander: commander.name,
                          commanderImage: commander.image_background,
                          colors: commander.color_identity || [],
                          commanderData: commander
                        });
                        setShowCommanderSuggestions(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        fontSize: '0.875rem',
                        borderBottom: idx < searchResults.length - 1 ? `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}` : 'none'
                      }}
                      onMouseEnter={e => {
                        e.target.style.backgroundColor = darkMode ? '#2d3748' : '#f7fafc';
                      }}
                      onMouseLeave={e => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{commander.name}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: darkMode ? '#a0aec0' : '#718096'
                      }}>
                        {commander.type_line}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {searchLoading && (
                <div style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: darkMode ? '#a0aec0' : '#718096',
                  fontSize: '0.75rem'
                }}>
                  Loading...
                </div>
              )}
            </div>
          </div>

          {/* Commander Details - Mana Colors and Keywords under commander name */}
          {player.commander && player.commanderData && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              {/* Mana Colors on the left */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {player.commanderData.color_identity && player.commanderData.color_identity.length > 0 &&
                  player.commanderData.color_identity.map((color, idx) => {
                    const colorMap = {
                      'W': { name: 'White', icon: whiteIcon },
                      'U': { name: 'Blue', icon: blueIcon },
                      'B': { name: 'Black', icon: blackIcon },
                      'R': { name: 'Red', icon: redIcon },
                      'G': { name: 'Green', icon: greenIcon }
                    };
                    const colorInfo = colorMap[color];

                    return (
                      <img
                        key={idx}
                        src={colorInfo?.icon}
                        alt={colorInfo?.name || color}
                        title={colorInfo?.name || color}
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '50%',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          objectFit: 'cover'
                        }}
                      />
                    );
                  })
                }
              </div>

              {/* Keywords on the right */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                justifyContent: 'flex-end'
              }}>
                {player.commanderData.keywords && player.commanderData.keywords.length > 0 &&
                  player.commanderData.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem',
                        backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        borderRadius: '0.25rem',
                        fontWeight: '600'
                      }}
                    >
                      {keyword}
                    </span>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}


      {/* Profile Options Dropdown */}
      {showOptions && !hasProfile && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '250px',
          backgroundColor: darkMode ? '#1a202c' : '#ffffff',
          border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}>
          {/* Use My Profile */}
          {currentProfile && !currentProfile.isGuest && (
            <button
              onClick={() => {
                handleSelectProfile(currentProfile);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                color: darkMode ? '#e2e8f0' : '#2d3748',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <User size={16} color="#8b5cf6" />
              <div>
                <div style={{ fontWeight: 'bold' }}>Use My Profile</div>
                <div style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#a0aec0' : '#718096'
                }}>
                  {currentProfile.display_name} (@{currentProfile.username})
                </div>
              </div>
            </button>
          )}

          {/* Enter Share Code */}
          <button
            onClick={() => {
              setShowOptions(false);
              setShowQuickAdd(true);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: filteredRecentPlayers.length > 0
                ? `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
                : 'none',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Hash size={16} />
            Enter Share Code
          </button>

          {/* Recent Players */}
          {filteredRecentPlayers.length > 0 && (
            <>
              <div style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                Recent Players
              </div>

              {/* Search Box */}
              {filteredRecentPlayers.length > 3 && (
                <div style={{ padding: '0 0.75rem 0.5rem' }}>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search players..."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                      border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '0.25rem',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
              )}

              <div style={{
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredRecentPlayers.map(recentPlayer => (
                  <button
                    key={recentPlayer.id}
                    onClick={() => handleSelectProfile(recentPlayer)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem'
                    }}
                    onMouseEnter={e => {
                      e.target.style.backgroundColor = darkMode ? '#2d3748' : '#f7fafc';
                    }}
                    onMouseLeave={e => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {recentPlayer.display_name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: darkMode ? '#a0aec0' : '#718096'
                    }}>
                      @{recentPlayer.username}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Guest Mode */}
          <button
            onClick={handleGuestMode}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderTop: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              color: darkMode ? '#a0aec0' : '#718096',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.875rem'
            }}
          >
            Continue without profile
          </button>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <ProfileQuickAdd
          darkMode={darkMode}
          onClose={() => setShowQuickAdd(false)}
          onProfileAdded={handleSelectProfile}
          existingProfiles={existingProfiles}
        />
      )}
    </div>
  );
};

export default PlayerSlot;