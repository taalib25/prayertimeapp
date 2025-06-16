/**
 * Unified User Hook
 * This hook provides a consistent interface for accessing and updating user data
 * across all components in the app
 */

import {useState, useEffect, useCallback} from 'react';
import {
  UserData,
  UserProfile,
  UserGoals,
  UserSettings,
  UserStats,
  UserUpdateData,
  UserGoalsUpdate,
  UserSettingsUpdate,
} from '../types/User';
import UnifiedUserService from '../services/UnifiedUserService';

interface UseUnifiedUserProps {
  uid: number;
  autoLoad?: boolean;
}

interface UseUnifiedUserReturn {
  // Data
  userData: UserData | null;
  profile: UserProfile | null;
  goals: UserGoals | null;
  settings: UserSettings | null;
  stats: UserStats | null;

  // States
  isLoading: boolean;
  error: string | null;

  // Actions
  loadUserData: () => Promise<void>;
  updateProfile: (updates: UserUpdateData) => Promise<void>;
  updateGoals: (updates: UserGoalsUpdate) => Promise<void>;
  updateSettings: (updates: UserSettingsUpdate) => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  // Utilities
  getDisplayName: () => string;
  getUserInitials: () => string;
  isProfileComplete: () => boolean;
}

export const useUnifiedUser = ({
  uid,
  autoLoad = true,
}: UseUnifiedUserProps): UseUnifiedUserReturn => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userService = UnifiedUserService.getInstance();

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize default data if needed
      await userService.initializeUserDataIfNeeded(uid);

      // Load complete user data
      const data = await userService.getUserById(uid);
      setUserData(data);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [uid, userService]);

  const updateProfile = useCallback(
    async (updates: UserUpdateData) => {
      try {
        setError(null);
        await userService.updateUserProfile(uid, updates);
        await loadUserData(); // Reload data after update
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
        throw err;
      }
    },
    [uid, userService, loadUserData],
  );

  const updateGoals = useCallback(
    async (updates: UserGoalsUpdate) => {
      try {
        setError(null);
        await userService.updateUserGoals(uid, updates);
        await loadUserData(); // Reload data after update
      } catch (err) {
        console.error('Error updating goals:', err);
        setError('Failed to update goals');
        throw err;
      }
    },
    [uid, userService, loadUserData],
  );

  const updateSettings = useCallback(
    async (updates: UserSettingsUpdate) => {
      try {
        setError(null);
        await userService.updateUserSettings(uid, updates);
        await loadUserData(); // Reload data after update
      } catch (err) {
        console.error('Error updating settings:', err);
        setError('Failed to update settings');
        throw err;
      }
    },
    [uid, userService, loadUserData],
  );

  const updateStats = useCallback(
    async (updates: Partial<UserStats>) => {
      try {
        setError(null);
        await userService.updateUserStats(uid, updates);
        await loadUserData(); // Reload data after update
      } catch (err) {
        console.error('Error updating stats:', err);
        setError('Failed to update stats');
        throw err;
      }
    },
    [uid, userService, loadUserData],
  );

  const refresh = useCallback(async () => {
    userService.clearCache();
    await loadUserData();
  }, [userService, loadUserData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getDisplayName = useCallback((): string => {
    if (!userData?.profile) return 'User';
    return userService.getDisplayName(userData.profile);
  }, [userData, userService]);

  const getUserInitials = useCallback((): string => {
    if (!userData?.profile) return 'U';
    return userService.getUserInitials(userData.profile);
  }, [userData, userService]);

  const isProfileComplete = useCallback((): boolean => {
    if (!userData?.profile) return false;
    return userService.isProfileComplete(userData.profile);
  }, [userData, userService]);

  // Auto-load user data on mount
  useEffect(() => {
    if (autoLoad) {
      loadUserData();
    }
  }, [autoLoad, loadUserData]);

  return {
    // Data
    userData,
    profile: userData?.profile || null,
    goals: userData?.goals || null,
    settings: userData?.settings || null,
    stats: userData?.stats || null,

    // States
    isLoading,
    error,

    // Actions
    loadUserData,
    updateProfile,
    updateGoals,
    updateSettings,
    updateStats,
    refresh,
    clearError,

    // Utilities
    getDisplayName,
    getUserInitials,
    isProfileComplete,
  };
};

// Helper hook for quick profile access
export const useUserProfile = (uid: number) => {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    getDisplayName,
    getUserInitials,
  } = useUnifiedUser({uid});

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    getDisplayName,
    getUserInitials,
  };
};

// Helper hook for quick goals access
export const useUserGoals = (uid: number) => {
  const {goals, isLoading, error, updateGoals} = useUnifiedUser({uid});

  return {
    goals,
    isLoading,
    error,
    updateGoals,
  };
};

// Helper hook for quick settings access
export const useUserSettings = (uid: number) => {
  const {settings, isLoading, error, updateSettings} = useUnifiedUser({uid});

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
};

// Helper hook for quick stats access
export const useUserStats = (uid: number) => {
  const {stats, isLoading, error, updateStats} = useUnifiedUser({uid});

  return {
    stats,
    isLoading,
    error,
    updateStats,
  };
};

// Enhanced hook for consistent user management across the app
export const useAppUser = (uid: number = 1001) => {
  const userHook = useUnifiedUser({uid, autoLoad: true});

  // Enhanced getDisplayName that handles various name formats
  const getDisplayName = useCallback((): string => {
    if (!userHook.userData?.profile) return 'User';

    const profile = userHook.userData.profile;

    // Priority order: firstName + lastName, username, email prefix
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }

    if (profile.username) {
      return profile.username;
    }

    // Fallback to email prefix
    return profile.email.split('@')[0];
  }, [userHook.userData]);

  // Enhanced getUserInitials
  const getUserInitials = useCallback((): string => {
    if (!userHook.userData?.profile) return 'U';

    const displayName = getDisplayName();
    const parts = displayName.split(' ');

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return displayName.substring(0, 2).toUpperCase();
  }, [getDisplayName]);

  // Enhanced profile completeness check
  const isProfileComplete = useCallback((): boolean => {
    if (!userHook.userData?.profile) return false;

    const profile = userHook.userData.profile;
    const requiredFields = ['username', 'email', 'phoneNumber'];
    const optionalFields = ['address', 'masjid', 'location'];

    const hasRequired = requiredFields.every(
      field => profile[field as keyof typeof profile],
    );
    const hasOptional = optionalFields.some(
      field => profile[field as keyof typeof profile],
    );

    return hasRequired && hasOptional;
  }, [userHook.userData]);

  // Get user's mosque information
  const getMosqueInfo = useCallback(() => {
    if (!userHook.userData) return null;

    return {
      name:
        userHook.userData.profile?.masjid ||
        userHook.userData.settings?.masjid ||
        'Local Mosque',
      location:
        userHook.userData.profile?.location ||
        userHook.userData.settings?.location ||
        'Location not set',
    };
  }, [userHook.userData]);

  return {
    ...userHook,

    // Enhanced utilities
    getDisplayName,
    getUserInitials,
    isProfileComplete,
    getMosqueInfo,

    // Quick access to commonly used data
    displayName: getDisplayName(),
    userInitials: getUserInitials(),
    mosqueInfo: getMosqueInfo(),

    // Profile completeness flag
    isComplete: isProfileComplete(),
  };
};
