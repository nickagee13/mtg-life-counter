/**
 * Profile Privacy Settings Component
 * Allows profile owners to manage privacy and sharing settings
 */

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Share2, Users, Eye, EyeOff, Globe, Shield } from 'lucide-react';
import { updateProfilePrivacy, isProfileOwner } from '../../lib/profiles/profileOwnership';
import ShareProfileModal from './ShareProfileModal';

const ProfilePrivacySettings = ({ profile, onUpdate, darkMode = true }) => {
    const [isPublic, setIsPublic] = useState(profile.is_public);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkOwnership();
    }, [profile.id]);

    const checkOwnership = async () => {
        try {
            const ownershipStatus = await isProfileOwner(profile.id);
            setIsOwner(ownershipStatus);
        } catch (error) {
            console.error('Error checking ownership:', error);
            setIsOwner(false);
        }
    };

    const togglePrivacy = async () => {
        if (!isOwner) return;

        setLoading(true);
        try {
            const newIsPublic = !isPublic;
            await updateProfilePrivacy(profile.id, newIsPublic);
            setIsPublic(newIsPublic);
            onUpdate({ ...profile, is_public: newIsPublic });
        } catch (error) {
            console.error('Error updating privacy:', error);
            alert('Failed to update privacy setting');
        } finally {
            setLoading(false);
        }
    };

    if (!isOwner) {
        return (
            <div style={{
                padding: '1rem',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '0.5rem',
                border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                textAlign: 'center'
            }}>
                <Shield size={24} color={darkMode ? '#a0aec0' : '#718096'} style={{ marginBottom: '0.5rem' }} />
                <p style={{
                    color: darkMode ? '#a0aec0' : '#718096',
                    fontSize: '0.875rem',
                    margin: 0
                }}>
                    You can only modify privacy settings for profiles you own
                </p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {/* Privacy Toggle */}
            <div style={{
                padding: '1rem',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '0.5rem',
                border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isPublic ? (
                            <Globe size={20} color="#10b981" />
                        ) : (
                            <Lock size={20} color="#8b5cf6" />
                        )}
                        <span style={{
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: darkMode ? '#e2e8f0' : '#2d3748'
                        }}>
                            {isPublic ? 'Public Profile' : 'Private Profile'}
                        </span>
                    </div>

                    <button
                        onClick={togglePrivacy}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: isPublic ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? '...' : (
                            <>
                                {isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                                Make {isPublic ? 'Private' : 'Public'}
                            </>
                        )}
                    </button>
                </div>

                <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: darkMode ? '#a0aec0' : '#718096',
                    lineHeight: '1.4'
                }}>
                    {isPublic ? (
                        <>
                            <strong>Public:</strong> Anyone can see and use this profile during games.
                            It will appear in everyone's profile list.
                        </>
                    ) : (
                        <>
                            <strong>Private:</strong> Only you can see this profile. Others can only
                            access it if you share a code with them.
                        </>
                    )}
                </p>
            </div>

            {/* Share Profile Button */}
            <button
                onClick={() => setShowShareModal(true)}
                style={{
                    padding: '1rem',
                    backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: darkMode ? '#e2e8f0' : '#2d3748',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                    e.target.style.backgroundColor = darkMode ? '#5a6578' : '#d2d9e8';
                }}
                onMouseLeave={e => {
                    e.target.style.backgroundColor = darkMode ? '#4a5568' : '#e2e8f0';
                }}
            >
                <Share2 size={20} />
                Share Profile
            </button>

            {/* Current Status Info */}
            <div style={{
                padding: '1rem',
                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0.5rem',
                border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                }}>
                    <Users size={16} color="#3b82f6" />
                    <span style={{
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: darkMode ? '#93c5fd' : '#1d4ed8'
                    }}>
                        Profile Status
                    </span>
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    color: darkMode ? '#a0aec0' : '#718096',
                    lineHeight: '1.4'
                }}>
                    <div>• Visibility: {isPublic ? 'Public' : 'Private'}</div>
                    <div>• Owner: This device</div>
                    <div>• Games played: {profile.games_played || 0}</div>
                    <div>• Win rate: {profile.win_rate || 0}%</div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareProfileModal
                    profile={profile}
                    darkMode={darkMode}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default ProfilePrivacySettings;