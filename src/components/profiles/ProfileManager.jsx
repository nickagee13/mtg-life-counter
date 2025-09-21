import React, { useState, useEffect } from 'react';
import {
  User, Users, UserPlus, BarChart3, Settings, LogOut, Share2, X
} from 'lucide-react';
import ProfileSetup from './ProfileSetup';
import ProfileStats from './ProfileStats';
import ProfileQuickAdd from './ProfileQuickAdd';
import {
  getAllProfiles,
  getProfile,
  deleteProfile
} from '../../lib/profiles/profileService';
import {
  getMyProfileId,
  setMyProfileId,
  getLastUsedProfile,
  setLastUsedProfile
} from '../../lib/profiles/localStorage';
import { formatShareCode } from '../../lib/profiles/codeGenerator';

const ProfileManager = ({ darkMode = true, onClose, onProfileChange }) => {
  const [view, setView] = useState('list'); // list, create, edit, stats, share
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [myProfileId, setMyId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadProfiles();
    const id = getMyProfileId();
    setMyId(id);
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllProfiles();
      setProfiles(data);

      // Auto-select last used profile
      const lastUsed = getLastUsedProfile();
      if (lastUsed) {
        const found = data.find(p => p.id === lastUsed.id);
        if (found) {
          setSelectedProfile(found);
        }
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = (profile) => {
    setMyProfileId(profile.id);
    setMyId(profile.id);
    setSelectedProfile(profile);
    setLastUsedProfile(profile);
    loadProfiles();
    setView('list');

    if (onProfileChange) {
      onProfileChange(profile);
    }
  };

  const handleEditProfile = (profile) => {
    loadProfiles();
    setSelectedProfile(profile);
    setView('list');
  };

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setLastUsedProfile(profile);

    if (onProfileChange) {
      onProfileChange(profile);
    }
  };

  const handleSetAsMyProfile = (profile) => {
    setMyProfileId(profile.id);
    setMyId(profile.id);
    setSelectedProfile(profile);
  };

  const handleDeleteProfile = async (profileId, event) => {
    if (event) {
      event.stopPropagation(); // Prevent profile selection when clicking delete
    }

    if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProfile(profileId);

      if (profileId === myProfileId) {
        setMyProfileId(null);
        setMyId(null);
      }

      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null);
      }

      loadProfiles();
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert('Failed to delete profile');
    }
  };

  const renderList = () => (
    <div>
      {/* Header Actions */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setView('create')}
          style={{
            flex: 1,
            padding: '1rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
          <UserPlus size={20} />
          Create New Profile
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          style={{
            flex: 1,
            padding: '1rem',
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            color: darkMode ? '#e2e8f0' : '#2d3748',
            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
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
          <Share2 size={20} />
          Add by Share Code
        </button>
      </div>

      {/* Selected Profile */}
      {selectedProfile && (
        <div style={{
          backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
          border: '2px solid #8b5cf6',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <User size={16} color="#8b5cf6" />
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  textTransform: 'uppercase'
                }}>
                  Current Profile
                </span>
                {selectedProfile.id === myProfileId && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#8b5cf6',
                    borderRadius: '0.25rem',
                    fontWeight: 'bold'
                  }}>
                    MY PROFILE
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                marginBottom: '0.25rem'
              }}>
                {selectedProfile.display_name}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                @{selectedProfile.username} • {formatShareCode(selectedProfile.share_code)}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setView('stats')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}
                title="View Stats"
              >
                <BarChart3 size={18} />
              </button>
              <button
                onClick={() => setView('edit')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}
                title="Edit Profile"
              >
                <Settings size={18} />
              </button>
              {selectedProfile.id !== myProfileId && (
                <button
                  onClick={() => handleSetAsMyProfile(selectedProfile)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#8b5cf6',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  title="Set as My Profile"
                >
                  <User size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: darkMode ? '#e2e8f0' : '#2d3748'
              }}>
                {selectedProfile.games_played || 0}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                Games
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: darkMode ? '#e2e8f0' : '#2d3748'
              }}>
                {selectedProfile.wins || 0}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                Wins
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: darkMode ? '#e2e8f0' : '#2d3748'
              }}>
                {selectedProfile.win_rate || 0}%
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                Win Rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Profiles */}
      <div>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          color: darkMode ? '#e2e8f0' : '#2d3748',
          marginBottom: '1rem'
        }}>
          All Profiles
        </h3>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: darkMode ? '#a0aec0' : '#718096'
          }}>
            Loading profiles...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        ) : profiles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            borderRadius: '0.75rem',
            border: `1px dashed ${darkMode ? '#4a5568' : '#e2e8f0'}`
          }}>
            <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p style={{
              color: darkMode ? '#a0aec0' : '#718096',
              marginBottom: '1rem'
            }}>
              No profiles found
            </p>
            <button
              onClick={() => setView('create')}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Create First Profile
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                  border: selectedProfile?.id === profile.id
                    ? '2px solid #8b5cf6'
                    : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    fontWeight: 'bold',
                    color: darkMode ? '#e2e8f0' : '#2d3748',
                    marginBottom: '0.25rem'
                  }}>
                    {profile.display_name}
                    {profile.id === myProfileId && (
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        color: '#8b5cf6',
                        borderRadius: '0.25rem',
                        fontWeight: 'normal'
                      }}>
                        MY PROFILE
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: darkMode ? '#a0aec0' : '#718096'
                  }}>
                    @{profile.username} • {formatShareCode(profile.share_code)}
                    {profile.primary_commander && (
                      <span> • {profile.primary_commander}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: darkMode ? '#a0aec0' : '#718096'
                  }}>
                    {profile.games_played || 0} games • {profile.win_rate || 0}%
                  </div>
                  <button
                    onClick={(event) => handleDeleteProfile(profile.id, event)}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete profile"
                    onMouseEnter={e => {
                      e.target.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {view === 'stats' && selectedProfile ? (
        <ProfileStats
          profileId={selectedProfile.id}
          profile={selectedProfile}
          darkMode={darkMode}
          onClose={() => setView('list')}
        />
      ) : (
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
            maxWidth: view === 'create' || view === 'edit' ? '600px' : '700px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            {view === 'list' && (
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={24} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    Profile Manager
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
            )}

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: view === 'list' ? '1.5rem' : 0
            }}>
              {view === 'list' && renderList()}
              {view === 'create' && (
                <ProfileSetup
                  darkMode={darkMode}
                  onComplete={handleCreateProfile}
                  onCancel={() => setView('list')}
                />
              )}
              {view === 'edit' && selectedProfile && (
                <ProfileSetup
                  profile={selectedProfile}
                  darkMode={darkMode}
                  onComplete={handleEditProfile}
                  onCancel={() => setView('list')}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Code Modal */}
      {showShareModal && (
        <ProfileQuickAdd
          darkMode={darkMode}
          onClose={() => setShowShareModal(false)}
          onProfileAdded={(profile) => {
            handleSelectProfile(profile);
            setShowShareModal(false);
            loadProfiles();
          }}
          existingProfiles={profiles}
        />
      )}
    </>
  );
};

export default ProfileManager;