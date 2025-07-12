/**
 * Simple User Hook
 * Uses the simplified user system with one user type and minimal complexity
 */

import {useState, useEffect, useCallback} from 'react';
import {User, SystemData, UserUpdate, SystemUpdate} from '../types/User';
import UserService from '../services/UserService';

interface UseUserReturn {
  // User data
  user: User | null;

  // System data
  systemData: SystemData | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // User actions
  updateUser: (updates: UserUpdate) => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<void>;

  // System actions
  updateSystemData: (updates: SystemUpdate) => Promise<void>;
  setAuthToken: (token: string) => Promise<void>;
  clearAuthToken: () => Promise<void>;
  markOnboardingAsSeen: () => Promise<void>;
  markProfileAlertAsSeen: () => Promise<void>;
  setCallPreference: (preference: boolean) => Promise<void>;

  // Auth checks
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  hasSeenProfileAlert: boolean;

  // Utility
  displayName: string;
  userInitials: string;

  // Actions
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userService = UserService.getInstance();

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize default data if needed
      await userService.initializeIfNeeded();

      // Load user and system data
      const [userData, systemData] = await Promise.all([
        userService.getUser(),
        userService.getSystemData(),
      ]);

      setUser(userData);
      setSystemData(systemData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [userService]);

  // Update user
  const updateUser = async (updates: UserUpdate) => {
    try {
      setError(null);
      const updatedUser = await userService.updateUser(updates);
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      throw err;
    }
  };

  // Create user
  const createUser = useCallback(
    async (userData: Partial<User>) => {
      try {
        setError(null);
        const newUser = await userService.createUser(userData);
        setUser(newUser);
      } catch (err) {
        console.error('Error creating user:', err);
        setError('Failed to create user');
        throw err;
      }
    },
    [userService],
  );

  // Update system data
  const updateSystemData = useCallback(
    async (updates: SystemUpdate) => {
      try {
        setError(null);
        const updatedSystem = await userService.updateSystemData(updates);
        setSystemData(updatedSystem);
      } catch (err) {
        console.error('Error updating system data:', err);
        setError('Failed to update system data');
        throw err;
      }
    },
    [userService],
  );

  // Set auth token
  const setAuthToken = useCallback(
    async (token: string) => {
      await updateSystemData({authToken: token});
    },
    [updateSystemData],
  );

  // Clear auth token
  const clearAuthToken = useCallback(async () => {
    await updateSystemData({authToken: null});
  }, [updateSystemData]);

  // Mark onboarding as seen
  const markOnboardingAsSeen = useCallback(async () => {
    await updateSystemData({hasSeenOnboarding: true});
  }, [updateSystemData]);

  // Mark profile alert as seen
  const markProfileAlertAsSeen = useCallback(async () => {
    await updateSystemData({hasSeenProfileAlert: true});
  }, [updateSystemData]);

  // Set call preference
  const setCallPreference = useCallback(
    async (preference: boolean) => {
      await updateSystemData({callPreference: preference});
    },
    [updateSystemData],
  );

  // Refresh data
  const refresh = useCallback(async () => {
    userService.clearCache();
    await loadData();
  }, [userService, loadData]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setError(null);
      await userService.clearAllData();
      setUser(null);
      setSystemData(null);
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Failed to logout');
      throw err;
    }
  }, [userService]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed values
  const isAuthenticated = systemData?.authToken ? true : false;
  const hasSeenOnboarding = systemData?.hasSeenOnboarding || false;
  const hasSeenProfileAlert = systemData?.hasSeenProfileAlert || false;
  const displayName = user ? userService.getDisplayName(user) : 'User';
  const userInitials = user ? userService.getUserInitials(user) : 'U';

  return {
    // Data
    user,
    systemData,

    // States
    isLoading,
    error,

    // User actions
    updateUser,
    createUser,

    // System actions
    updateSystemData,
    setAuthToken,
    clearAuthToken,
    markOnboardingAsSeen,
    markProfileAlertAsSeen,
    setCallPreference,

    // Computed
    isAuthenticated,
    hasSeenOnboarding,
    hasSeenProfileAlert,
    displayName,
    userInitials,

    // Actions
    refresh,
    logout,
    clearError,
  };
};
