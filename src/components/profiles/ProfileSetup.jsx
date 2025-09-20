import React, { useState, useEffect } from 'react';
import {
  User, UserPlus, Save, AlertCircle, Check, Copy, Share2
} from 'lucide-react';
import {
  createProfile,
  isUsernameAvailable,
  updateProfile
} from '../../lib/profiles/profileService';
import { formatShareCode } from '../../lib/profiles/codeGenerator';
import { setMyProfileId } from '../../lib/profiles/localStorage';

const ProfileSetup = ({ profile = null, darkMode = true, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    primary_commander: profile?.primary_commander || '',
    color_identity: profile?.color_identity || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [shareCode, setShareCode] = useState(profile?.share_code || null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isEditMode = !!profile;

  // Debounced username availability check
  useEffect(() => {
    if (!isEditMode && formData.username.length >= 3) {
      const timer = setTimeout(async () => {
        setCheckingUsername(true);
        try {
          const available = await isUsernameAvailable(formData.username);
          setUsernameAvailable(available);
          if (!available) {
            setErrors(prev => ({
              ...prev,
              username: 'Username is already taken'
            }));
          } else {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.username;
              return newErrors;
            });
          }
        } catch (error) {
          console.error('Error checking username:', error);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.username, isEditMode]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Display name validation
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.length > 30) {
      newErrors.display_name = 'Display name must be less than 30 characters';
    }

    // Commander validation (optional)
    if (formData.primary_commander && formData.primary_commander.length > 100) {
      newErrors.primary_commander = 'Commander name is too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isEditMode && !usernameAvailable) {
      setErrors({ username: 'Username is not available' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let result;
      if (isEditMode) {
        // Update existing profile
        result = await updateProfile(profile.id, {
          display_name: formData.display_name,
          primary_commander: formData.primary_commander || null,
          color_identity: formData.color_identity || null
        });
      } else {
        // Create new profile
        result = await createProfile(formData);
        setShareCode(result.share_code);
        setMyProfileId(result.id);
      }

      setShowSuccess(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete(result);
        }
      }, isEditMode ? 1000 : 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({
        submit: error.message || 'Failed to save profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '500px',
      margin: '0 auto',
      color: darkMode ? '#e2e8f0' : '#2d3748'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          marginBottom: '1rem'
        }}>
          {isEditMode ? <User size={32} color="white" /> : <UserPlus size={32} color="white" />}
        </div>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          {isEditMode ? 'Edit Profile' : 'Create Your Profile'}
        </h2>
        <p style={{
          fontSize: '1rem',
          color: darkMode ? '#a0aec0' : '#718096'
        }}>
          {isEditMode
            ? 'Update your profile information'
            : 'Set up your profile to track stats and share with friends'}
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '2px solid #22c55e',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Check size={24} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 'bold', color: '#22c55e' }}>
              Profile {isEditMode ? 'Updated' : 'Created'} Successfully!
            </div>
            {!isEditMode && shareCode && (
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Your share code: <strong>{formatShareCode(shareCode)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Username (only for new profiles) */}
        {!isEditMode && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                  border: errors.username
                    ? '2px solid #ef4444'
                    : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  color: darkMode ? '#e2e8f0' : '#2d3748',
                  fontSize: '1rem'
                }}
              />
              {checkingUsername && (
                <div style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #8b5cf6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
              )}
              {!checkingUsername && usernameAvailable === true && formData.username && (
                <Check size={20} color="#22c55e" style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
              )}
              {!checkingUsername && usernameAvailable === false && (
                <AlertCircle size={20} color="#ef4444" style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
              )}
            </div>
            {errors.username && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}>
                {errors.username}
              </p>
            )}
            <p style={{
              fontSize: '0.75rem',
              color: darkMode ? '#a0aec0' : '#718096',
              marginTop: '0.25rem'
            }}>
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>
        )}

        {/* Display Name */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: darkMode ? '#e2e8f0' : '#2d3748'
          }}>
            Display Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            placeholder="Your name as shown to others"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
              border: errors.display_name
                ? '2px solid #ef4444'
                : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              fontSize: '1rem'
            }}
          />
          {errors.display_name && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.75rem',
              marginTop: '0.25rem'
            }}>
              {errors.display_name}
            </p>
          )}
        </div>

        {/* Primary Commander (Optional) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: darkMode ? '#e2e8f0' : '#2d3748'
          }}>
            Primary Commander <span style={{ color: '#a0aec0', fontSize: '0.75rem' }}>(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.primary_commander}
            onChange={(e) => handleInputChange('primary_commander', e.target.value)}
            placeholder="e.g., Atraxa, Praetors' Voice"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
              border: errors.primary_commander
                ? '2px solid #ef4444'
                : `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              fontSize: '1rem'
            }}
          />
          {errors.primary_commander && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.75rem',
              marginTop: '0.25rem'
            }}>
              {errors.primary_commander}
            </p>
          )}
        </div>

        {/* Share Code Display (for existing profiles) */}
        {isEditMode && shareCode && (
          <div style={{
            backgroundColor: darkMode ? '#4a5568' : '#edf2f7',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  color: darkMode ? '#a0aec0' : '#718096',
                  marginBottom: '0.25rem'
                }}>
                  Your Share Code
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em'
                }}>
                  {formatShareCode(shareCode)}
                </div>
              </div>
              <button
                type="button"
                onClick={copyShareCode}
                style={{
                  padding: '0.5rem',
                  backgroundColor: darkMode ? '#2d3748' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
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
              {errors.submit}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '2rem'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || checkingUsername || (!isEditMode && usernameAvailable === false)}
            style={{
              flex: 2,
              padding: '0.75rem',
              background: loading || (!isEditMode && usernameAvailable === false)
                ? '#a0aec0'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading || (!isEditMode && usernameAvailable === false) ? 'not-allowed' : 'pointer',
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
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={20} />
                {isEditMode ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Section for New Profiles */}
      {!isEditMode && !showSuccess && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
          borderRadius: '0.75rem',
          border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <Share2 size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: darkMode ? '#e2e8f0' : '#2d3748'
              }}>
                Share Your Profile
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: darkMode ? '#a0aec0' : '#718096',
                lineHeight: 1.5
              }}>
                After creating your profile, you'll receive a unique 6-character share code.
                Share this code with friends so they can add you to their games and track stats together!
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        button {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;