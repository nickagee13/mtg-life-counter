import React, { useState, useRef, useEffect } from 'react';
import {
  X, UserPlus, Search, Clock, Users, Hash, AlertCircle, CheckCircle
} from 'lucide-react';
import { getProfileByShareCode } from '../../lib/profiles/profileService';
import { parseShareCode, validateShareCode } from '../../lib/profiles/codeGenerator';
import { getRecentPlayers, addRecentPlayer } from '../../lib/profiles/localStorage';

const ProfileQuickAdd = ({ darkMode = true, onClose, onProfileAdded, existingProfiles = [] }) => {
  const [mode, setMode] = useState('input'); // 'input', 'recent', 'search'
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addedProfile, setAddedProfile] = useState(null);
  const [recentPlayers, setRecentPlayers] = useState([]);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Load recent players on mount
    const recent = getRecentPlayers();
    setRecentPlayers(recent);

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle individual character input for share code
  const handleCodeInput = (index, value) => {
    const upperValue = value.toUpperCase();

    // Only allow valid characters
    if (index < 3 && !/^[A-Z]?$/.test(upperValue)) return;
    if (index >= 3 && !/^[0-9]?$/.test(value)) return;

    const codeArray = shareCode.split('');
    codeArray[index] = upperValue;
    const newCode = codeArray.join('').padEnd(6, '');
    setShareCode(newCode.substring(0, 6));

    // Auto-advance to next input
    if (upperValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when typing
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !shareCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePaste(e);
    }
  };

  const handlePaste = async (e) => {
    const pastedText = e.clipboardData?.getData('text') || await navigator.clipboard.readText();
    const parsed = parseShareCode(pastedText);

    if (validateShareCode(parsed)) {
      setShareCode(parsed);
      // Fill all inputs
      parsed.split('').forEach((char, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i].value = char;
        }
      });
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!validateShareCode(shareCode)) {
      setError('Please enter a valid 6-character code');
      return;
    }

    // Check if profile already added
    const alreadyAdded = existingProfiles.some(
      p => p.share_code === shareCode
    );

    if (alreadyAdded) {
      setError('This profile is already added to the game');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await getProfileByShareCode(shareCode);

      // Add to recent players
      addRecentPlayer(profile);

      // Show success
      setAddedProfile(profile);
      setSuccess(true);

      // Call callback
      if (onProfileAdded) {
        onProfileAdded(profile);
      }

      // Close after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding profile:', err);
      setError(err.message || 'Failed to find profile with this code');
    } finally {
      setLoading(false);
    }
  };

  const handleRecentPlayerSelect = (player) => {
    // Check if already added
    const alreadyAdded = existingProfiles.some(
      p => p.id === player.id
    );

    if (alreadyAdded) {
      setError('This profile is already added to the game');
      return;
    }

    // Update last used time
    addRecentPlayer(player);

    if (onProfileAdded) {
      onProfileAdded(player);
    }

    onClose();
  };

  const filteredRecentPlayers = recentPlayers.filter(
    player => !existingProfiles.some(p => p.id === player.id)
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1a202c' : '#ffffff',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserPlus size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              Add Player
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
        }}>
          <button
            onClick={() => setMode('input')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: mode === 'input'
                ? (darkMode ? '#2d3748' : '#f7fafc')
                : 'transparent',
              border: 'none',
              borderBottom: mode === 'input' ? '2px solid #8b5cf6' : 'none',
              color: mode === 'input'
                ? '#8b5cf6'
                : (darkMode ? '#a0aec0' : '#718096'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: mode === 'input' ? 'bold' : 'normal'
            }}
          >
            <Hash size={16} />
            Share Code
          </button>
          <button
            onClick={() => setMode('recent')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: mode === 'recent'
                ? (darkMode ? '#2d3748' : '#f7fafc')
                : 'transparent',
              border: 'none',
              borderBottom: mode === 'recent' ? '2px solid #8b5cf6' : 'none',
              color: mode === 'recent'
                ? '#8b5cf6'
                : (darkMode ? '#a0aec0' : '#718096'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: mode === 'recent' ? 'bold' : 'normal'
            }}
          >
            <Clock size={16} />
            Recent
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {mode === 'input' && (
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: darkMode ? '#a0aec0' : '#718096',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Enter the 6-character share code
              </p>

              {/* Code Input Boxes */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <React.Fragment key={index}>
                    <input
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      maxLength="1"
                      value={shareCode[index] || ''}
                      onChange={(e) => handleCodeInput(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        border: error
                          ? '2px solid #ef4444'
                          : `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        borderRadius: '0.5rem',
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        textTransform: 'uppercase'
                      }}
                      placeholder={index < 3 ? 'A' : '0'}
                    />
                    {index === 2 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: darkMode ? '#4a5568' : '#cbd5e0',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        -
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Success Message */}
              {success && addedProfile && (
                <div style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid #22c55e',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={18} color="#22c55e" />
                  <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>
                    Added {addedProfile.display_name}!
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} color="#ef4444" />
                  <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || shareCode.length !== 6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading || shareCode.length !== 6
                    ? '#a0aec0'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading || shareCode.length !== 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Finding Profile...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Add Player
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'recent' && (
            <div>
              {filteredRecentPlayers.length > 0 ? (
                <>
                  <p style={{
                    fontSize: '0.875rem',
                    color: darkMode ? '#a0aec0' : '#718096',
                    marginBottom: '1rem'
                  }}>
                    Select a recent player
                  </p>
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {filteredRecentPlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handleRecentPlayerSelect(player)}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                          border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                          borderRadius: '0.5rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.target.style.backgroundColor = darkMode ? '#4a5568' : '#edf2f7';
                        }}
                        onMouseLeave={e => {
                          e.target.style.backgroundColor = darkMode ? '#2d3748' : '#f7fafc';
                        }}
                      >
                        <div style={{
                          fontWeight: 'bold',
                          color: darkMode ? '#e2e8f0' : '#2d3748',
                          marginBottom: '0.25rem'
                        }}>
                          {player.display_name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: darkMode ? '#a0aec0' : '#718096',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>@{player.username}</span>
                          {player.share_code && (
                            <>
                              <span>•</span>
                              <span>{player.share_code.substring(0, 3)} {player.share_code.substring(3)}</span>
                            </>
                          )}
                          {player.primary_commander && (
                            <>
                              <span>•</span>
                              <span>{player.primary_commander}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: darkMode ? '#a0aec0' : '#718096'
                }}>
                  <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p style={{ marginBottom: '0.5rem' }}>No recent players</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Players you've added before will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6 !important;
        }
      `}</style>
    </div>
  );
};

export default ProfileQuickAdd;