/**
 * Share Profile Modal Component
 * Allows users to generate and manage share codes for their profiles
 */

import React, { useState, useEffect } from 'react';
import {
    Copy, Clock, Infinity, X, Share2, Users, Calendar,
    Hash, CheckCircle, AlertCircle, Trash2, Eye
} from 'lucide-react';
import {
    shareProfile,
    getMyShareCodes,
    deactivateShareCode,
    formatShareCode,
    getShareCodeStats
} from '../../lib/profiles/shareSystem';

const ShareProfileModal = ({ profile, darkMode = true, onClose }) => {
    const [shareType, setShareType] = useState('temporary');
    const [duration, setDuration] = useState(24);
    const [maxUses, setMaxUses] = useState('');
    const [shareCode, setShareCode] = useState(null);
    const [copying, setCopying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [existingCodes, setExistingCodes] = useState([]);
    const [showExisting, setShowExisting] = useState(false);

    useEffect(() => {
        loadExistingCodes();
    }, [profile.id]);

    const loadExistingCodes = async () => {
        try {
            const codes = await getMyShareCodes();
            const profileCodes = codes.filter(code => code.profile_id === profile.id);
            setExistingCodes(profileCodes);
        } catch (error) {
            console.error('Error loading existing codes:', error);
        }
    };

    const generateShareCode = async () => {
        setLoading(true);
        setError(null);

        try {
            const options = {
                shareType,
                expiresInHours: shareType === 'temporary' ? duration : null,
                maxUses: maxUses ? parseInt(maxUses) : null
            };

            const share = await shareProfile(profile.id, options);
            setShareCode(share);
            await loadExistingCodes(); // Refresh the list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyShareCode = async () => {
        if (!shareCode) return;

        setCopying(true);
        try {
            await navigator.clipboard.writeText(shareCode.share_code);
            setTimeout(() => setCopying(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for browsers without clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = shareCode.share_code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setTimeout(() => setCopying(false), 2000);
        }
    };

    const deactivateCode = async (codeId) => {
        try {
            await deactivateShareCode(codeId);
            await loadExistingCodes(); // Refresh the list
        } catch (error) {
            console.error('Error deactivating code:', error);
            alert('Failed to deactivate share code');
        }
    };

    const formatDuration = (hours) => {
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    const formatTimeRemaining = (timeRemaining) => {
        if (!timeRemaining || timeRemaining <= 0) return 'Expired';

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: darkMode ? '#1a202c' : '#ffffff',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Share2 size={24} color="#8b5cf6" />
                        <div>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: darkMode ? '#e2e8f0' : '#2d3748'
                            }}>
                                Share Profile
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: darkMode ? '#a0aec0' : '#718096'
                            }}>
                                {profile.display_name} (@{profile.username})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: darkMode ? '#a0aec0' : '#718096',
                            cursor: 'pointer',
                            borderRadius: '0.25rem'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        marginBottom: '1.5rem',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '0.5rem',
                        padding: '0.25rem'
                    }}>
                        <button
                            onClick={() => setShowExisting(false)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: !showExisting ? (darkMode ? '#4a5568' : '#e2e8f0') : 'transparent',
                                border: 'none',
                                borderRadius: '0.375rem',
                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}
                        >
                            Create New
                        </button>
                        <button
                            onClick={() => setShowExisting(true)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: showExisting ? (darkMode ? '#4a5568' : '#e2e8f0') : 'transparent',
                                border: 'none',
                                borderRadius: '0.375rem',
                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Eye size={16} />
                            Existing ({existingCodes.length})
                        </button>
                    </div>

                    {showExisting ? (
                        /* Existing Codes */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {existingCodes.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: darkMode ? '#a0aec0' : '#718096'
                                }}>
                                    <Hash size={48} style={{ margin: '0 auto 1rem' }} />
                                    <p>No active share codes</p>
                                </div>
                            ) : (
                                existingCodes.map(code => (
                                    <div
                                        key={code.id}
                                        style={{
                                            padding: '1rem',
                                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderRadius: '0.5rem',
                                            border: `1px solid ${code.isExpired ? '#ef4444' : (darkMode ? '#4a5568' : '#e2e8f0')}`
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontSize: '1.125rem',
                                                fontWeight: 'bold',
                                                color: darkMode ? '#e2e8f0' : '#2d3748'
                                            }}>
                                                {formatShareCode(code.share_code)}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(code.share_code);
                                                    }}
                                                    style={{
                                                        padding: '0.25rem',
                                                        backgroundColor: 'transparent',
                                                        border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                                                        borderRadius: '0.25rem',
                                                        color: darkMode ? '#a0aec0' : '#718096',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deactivateCode(code.id)}
                                                    style={{
                                                        padding: '0.25rem',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #ef4444',
                                                        borderRadius: '0.25rem',
                                                        color: '#ef4444',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: darkMode ? '#a0aec0' : '#718096',
                                            lineHeight: '1.4'
                                        }}>
                                            <div>Type: {code.share_type}</div>
                                            <div>Used: {code.used_count} times{code.max_uses ? ` / ${code.max_uses}` : ''}</div>
                                            {code.expires_at && (
                                                <div style={{ color: code.isExpired ? '#ef4444' : 'inherit' }}>
                                                    {formatTimeRemaining(code.timeRemaining)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Create New Code */
                        <div>
                            {!shareCode ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Share Type Selection */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: darkMode ? '#e2e8f0' : '#2d3748',
                                            marginBottom: '0.75rem'
                                        }}>
                                            Share Type
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {[
                                                { value: 'temporary', icon: Clock, label: 'Temporary', desc: 'Expires after a set time' },
                                                { value: 'permanent', icon: Infinity, label: 'Permanent', desc: 'Never expires' },
                                                { value: 'game_session', icon: Users, label: 'Game Session', desc: 'For one game only' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '1rem',
                                                        backgroundColor: shareType === option.value
                                                            ? (darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
                                                            : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                                                        border: `1px solid ${shareType === option.value ? '#8b5cf6' : (darkMode ? '#4a5568' : '#e2e8f0')}`,
                                                        borderRadius: '0.5rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={option.value}
                                                        checked={shareType === option.value}
                                                        onChange={(e) => setShareType(e.target.value)}
                                                        style={{ margin: 0 }}
                                                    />
                                                    <option.icon size={20} color={shareType === option.value ? '#8b5cf6' : (darkMode ? '#a0aec0' : '#718096')} />
                                                    <div>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: darkMode ? '#e2e8f0' : '#2d3748',
                                                            marginBottom: '0.25rem'
                                                        }}>
                                                            {option.label}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: darkMode ? '#a0aec0' : '#718096'
                                                        }}>
                                                            {option.desc}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration Setting for Temporary */}
                                    {shareType === 'temporary' && (
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                                marginBottom: '0.75rem'
                                            }}>
                                                Expires After
                                            </label>
                                            <select
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                                                    border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                                                    borderRadius: '0.5rem',
                                                    color: darkMode ? '#e2e8f0' : '#2d3748',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                <option value={1}>1 hour</option>
                                                <option value={6}>6 hours</option>
                                                <option value={24}>24 hours</option>
                                                <option value={72}>3 days</option>
                                                <option value={168}>1 week</option>
                                                <option value={720}>30 days</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Max Uses Setting */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: darkMode ? '#e2e8f0' : '#2d3748',
                                            marginBottom: '0.75rem'
                                        }}>
                                            Maximum Uses (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={maxUses}
                                            onChange={(e) => setMaxUses(e.target.value)}
                                            placeholder="Unlimited"
                                            min="1"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                                                border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                                                borderRadius: '0.5rem',
                                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>

                                    {/* Error Display */}
                                    {error && (
                                        <div style={{
                                            padding: '0.75rem',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid #ef4444',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <AlertCircle size={16} color="#ef4444" />
                                            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                                                {error}
                                            </span>
                                        </div>
                                    )}

                                    {/* Generate Button */}
                                    <button
                                        onClick={generateShareCode}
                                        disabled={loading}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: '#8b5cf6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            opacity: loading ? 0.7 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Share2 size={20} />
                                        {loading ? 'Generating...' : 'Generate Share Code'}
                                    </button>
                                </div>
                            ) : (
                                /* Share Code Display */
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1.5rem'
                                }}>
                                    <div style={{
                                        padding: '1.5rem',
                                        backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                        border: '1px solid #10b981',
                                        borderRadius: '0.75rem',
                                        textAlign: 'center',
                                        width: '100%'
                                    }}>
                                        <CheckCircle size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
                                        <h4 style={{
                                            margin: '0 0 1rem 0',
                                            color: darkMode ? '#e2e8f0' : '#2d3748',
                                            fontSize: '1.125rem'
                                        }}>
                                            Share Code Generated!
                                        </h4>

                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                            borderRadius: '0.5rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                                letterSpacing: '0.2em',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {formatShareCode(shareCode.share_code)}
                                            </div>
                                            <button
                                                onClick={copyShareCode}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: copying ? '#10b981' : '#8b5cf6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    margin: '0 auto'
                                                }}
                                            >
                                                {copying ? <CheckCircle size={16} /> : <Copy size={16} />}
                                                {copying ? 'Copied!' : 'Copy Code'}
                                            </button>
                                        </div>

                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: darkMode ? '#a0aec0' : '#718096',
                                            lineHeight: '1.5'
                                        }}>
                                            Share this code with others to let them use your profile
                                            {shareType === 'temporary' && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <strong>Expires in {formatDuration(duration)}</strong>
                                                </div>
                                            )}
                                            {maxUses && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <strong>Maximum {maxUses} uses</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShareCode(null)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: 'transparent',
                                            border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                                            borderRadius: '0.5rem',
                                            color: darkMode ? '#e2e8f0' : '#2d3748',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Create Another Code
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareProfileModal;