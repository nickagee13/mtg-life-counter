import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllProfiles, createProfile as createProfileService } from '../lib/profiles/profileService';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load profiles from Supabase
  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  // Create new profile
  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      // Check if username already exists
      const existingProfile = allProfiles.find(p => p.username === profileData.username);
      if (existingProfile) {
        throw new Error('Username already exists');
      }

      const newProfile = await createProfileService(profileData);
      setAllProfiles(prev => [...prev, newProfile]);
      setCurrentProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Select profile
  const selectProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentProfileId', profile.id);
  };

  // Create guest profile
  const createGuestProfile = (guestName) => {
    const guestProfile = {
      id: `guest_${Date.now()}`,
      username: `guest_${Date.now()}`,
      display_name: guestName || 'Guest Player',
      avatar_url: null,
      isGuest: true,
      stats: {
        total_games: 0,
        wins: 0,
        win_rate: 0
      }
    };
    setCurrentProfile(guestProfile);
    return guestProfile;
  };

  // Clear current profile
  const clearProfile = () => {
    setCurrentProfile(null);
    localStorage.removeItem('currentProfileId');
  };

  // Get profile by ID
  const getProfileById = (id) => {
    return allProfiles.find(p => p.id === id);
  };

  // Try to restore profile from localStorage on mount
  useEffect(() => {
    const savedProfileId = localStorage.getItem('currentProfileId');
    if (savedProfileId && allProfiles.length > 0) {
      const savedProfile = getProfileById(savedProfileId);
      if (savedProfile) {
        setCurrentProfile(savedProfile);
      }
    }
  }, [allProfiles]);

  const value = {
    currentProfile,
    allProfiles,
    loading,
    error,
    loadProfiles,
    createProfile,
    selectProfile,
    createGuestProfile,
    clearProfile,
    getProfileById
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};