/**
 * Share Code Entry Component
 * Allows users to enter share codes to access profiles
 */

import React, { useState } from 'react';
import { Hash, UserPlus, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useShareCode, validateShareCodeFormat, parseShareCode } from '../../lib/profiles/shareSystem';

const ShareCodeEntry = ({ darkMode = true, onProfileAdded, onClose }) => {
    const [shareCode, setShareCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!shareCode.trim()) {
            setError('Please enter a share code');
            return;
        }

        const cleanCode = parseShareCode(shareCode);

        if (!validateShareCodeFormat(cleanCode)) {
            setError('Invalid share code format. Expected format: ABC123');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const profile = await useShareCode(cleanCode);
            setSuccess(`Successfully added ${profile.username}!`);

            if (onProfileAdded) {
                onProfileAdded(profile);
            }

            // Close after a delay
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        let value = e.target.value.toUpperCase();

        // Remove any non-alphanumeric characters
        value = value.replace(/[^A-Z0-9]/g, '');

        // Limit to 6 characters
        if (value.length > 6) {
            value = value.substring(0, 6);
        }

        // Auto-format with dash after 3 characters
        if (value.length > 3) {
            value = `${value.substring(0, 3)}-${value.substring(3)}`;
        }

        setShareCode(value);

        // Clear any existing error when user starts typing
        if (error) setError(null);
        if (success) setSuccess(null);
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
                maxWidth: '400px',
                padding: '1.5rem'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Hash size={24} color="#8b5cf6" />
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: darkMode ? '#e2e8f0' : '#2d3748'
                        }}>
                            Enter Share Code
                        </h3>
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

                {/* Instructions */}
                <p style={{
                    margin: '0 0 1.5rem 0',
                    fontSize: '0.875rem',
                    color: darkMode ? '#a0aec0' : '#718096',
                    lineHeight: '1.5'
                }}>
                    Enter a 6-character share code to access someone's profile for this game session.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: darkMode ? '#e2e8f0' : '#2d3748',
                            marginBottom: '0.5rem'
                        }}>
                            Share Code
                        </label>
                        <input
                            type="text"
                            value={shareCode}
                            onChange={handleCodeChange}
                            placeholder="ABC-123"
                            maxLength={7} // Including the dash
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                                border: `2px solid ${
                                    error ? '#ef4444' :
                                    success ? '#10b981' :
                                    (darkMode ? '#4a5568' : '#e2e8f0')
                                }`,
                                borderRadius: '0.5rem',
                                color: darkMode ? '#e2e8f0' : '#2d3748',
                                fontSize: '1.125rem',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                letterSpacing: '0.1em',
                                outline: 'none',
                                opacity: loading ? 0.7 : 1
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
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <AlertCircle size={16} color="#ef4444" />
                            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                                {error}
                            </span>
                        </div>
                    )}

                    {/* Success Display */}
                    {success && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <CheckCircle size={16} color="#10b981" />
                            <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                                {success}
                            </span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !shareCode.trim() || success}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: success ? '#10b981' : '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: (loading || !shareCode.trim() || success) ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            opacity: (loading || !shareCode.trim()) ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? (
                            'Checking...'
                        ) : success ? (
                            <>
                                <CheckCircle size={20} />
                                Added Successfully
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                Add Profile
                            </>
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: darkMode ? '#93c5fd' : '#1d4ed8',
                    lineHeight: '1.4'
                }}>
                    <strong>Need a share code?</strong><br />
                    Ask the profile owner to generate one from their Privacy Settings.
                    Share codes can be temporary (expire) or permanent.
                </div>
            </div>
        </div>
    );
};

export default ShareCodeEntry;