import React, { useState } from 'react';
import { User, Plus, X, UserPlus, Users } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

const ProfileManager = ({ darkMode, onClose, onProfileSelected }) => {
  const {
    currentProfile,
    allProfiles,
    loading,
    error,
    createProfile,
    selectProfile,
    createGuestProfile
  } = useProfile();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    display_name: ''
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Handle form submission
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.display_name.trim()) {
      setFormError('Both username and display name are required');
      return;
    }

    try {
      setCreating(true);
      setFormError('');

      const profile = await createProfile({
        username: formData.username.trim(),
        display_name: formData.display_name.trim()
      });

      setFormData({ username: '', display_name: '' });
      setShowCreateForm(false);
      onProfileSelected(profile);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  // Handle profile selection
  const handleSelectProfile = (profile) => {
    selectProfile(profile);
    onProfileSelected(profile);
    onClose();
  };

  // Handle guest mode
  const handleGuestMode = () => {
    const guestProfile = createGuestProfile('Guest Player');
    onProfileSelected(guestProfile);
    onClose();
  };

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
            <Users size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              Select Profile
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

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          overflow: 'auto',
          flex: 1
        }}>
          {/* Current Profile */}
          {currentProfile && (
            <div style={{
              backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <User size={20} color="#8b5cf6" />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  textTransform: 'uppercase'
                }}>
                  Current Profile
                </span>
              </div>
              <div style={{
                fontWeight: 'bold',
                fontSize: '1.125rem',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                marginBottom: '0.25rem'
              }}>
                {currentProfile.display_name}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: darkMode ? '#a0aec0' : '#718096'
              }}>
                @{currentProfile.username} {currentProfile.isGuest && '(Guest)'}
              </div>
            </div>
          )}

          {/* Existing Profiles */}
          {!showCreateForm && (
            <>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                marginBottom: '1rem'
              }}>
                Choose Profile
              </h3>

              {loading ? (
                <div style={{
                  textAlign: 'center',
                  color: darkMode ? '#a0aec0' : '#718096',
                  padding: '2rem'
                }}>
                  Loading profiles...
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {allProfiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile)}
                      style={{
                        backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                        border: currentProfile?.id === profile.id
                          ? '2px solid #8b5cf6'
                          : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (currentProfile?.id !== profile.id) {
                          e.target.style.backgroundColor = darkMode ? '#4a5568' : '#edf2f7';
                        }
                      }}
                      onMouseLeave={e => {
                        if (currentProfile?.id !== profile.id) {
                          e.target.style.backgroundColor = darkMode ? '#2d3748' : '#f7fafc';
                        }
                      }}
                    >
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '1.125rem',
                        color: darkMode ? '#e2e8f0' : '#2d3748',
                        marginBottom: '0.25rem'
                      }}>
                        {profile.display_name}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: darkMode ? '#a0aec0' : '#718096'
                      }}>
                        @{profile.username}
                      </div>
                      {profile.stats && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: darkMode ? '#a0aec0' : '#718096',
                          marginTop: '0.25rem'
                        }}>
                          {profile.stats.total_games || 0} games • {profile.stats.win_rate || 0}% win rate
                        </div>
                      )}
                    </button>
                  ))}

                  {allProfiles.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: darkMode ? '#a0aec0' : '#718096',
                      padding: '2rem'
                    }}>
                      No profiles found. Create your first profile below!
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowCreateForm(true)}
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
                  <UserPlus size={20} />
                  Create New Profile
                </button>

                <button
                  onClick={handleGuestMode}
                  style={{
                    padding: '1rem',
                    backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#2d3748',
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
                  <User size={20} />
                  Continue as Guest
                </button>
              </div>
            </>
          )}

          {/* Create Profile Form */}
          {showCreateForm && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: darkMode ? '#e2e8f0' : '#2d3748'
                }}>
                  Create New Profile
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError('');
                    setFormData({ username: '', display_name: '' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: darkMode ? '#a0aec0' : '#718096',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProfile}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: darkMode ? '#e2e8f0' : '#2d3748',
                    marginBottom: '0.5rem'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter a unique username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                      border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: darkMode ? '#e2e8f0' : '#2d3748',
                    marginBottom: '0.5rem'
                  }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter your display name"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                      border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                {formError && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.25rem'
                  }}>
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: creating
                      ? '#a0aec0'
                      : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Plus size={20} />
                  {creating ? 'Creating...' : 'Create Profile'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;