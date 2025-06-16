/**
 * Unified User Service
 * This service provides a consistent interface for all user-related operations
 * across the app, ensuring data consistency and type safety
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserData,
  UserProfile,
  UserGoals,
  UserSettings,
  UserStats,
  UserUpdateData,
  UserGoalsUpdate,
  UserSettingsUpdate,
  DEFAULT_USER_GOALS,
  DEFAULT_USER_SETTINGS,
  DEFAULT_USER_STATS,
  USER_STORAGE_KEYS,
  AuthUser,
} from '../types/User';

class UnifiedUserService {
  private static instance: UnifiedUserService;
  private cache = new Map<string, any>();

  private constructor() {}

  static getInstance(): UnifiedUserService {
    if (!UnifiedUserService.instance) {
      UnifiedUserService.instance = new UnifiedUserService();
    }
    return UnifiedUserService.instance;
  }

  // ========== AUTH USER OPERATIONS ==========

  /**
   * Get authenticated user from storage
   */
  async getAuthUser(): Promise<AuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEYS.AUTH_USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting auth user:', error);
      return null;
    }
  }

  /**
   * Save authenticated user to storage
   */
  async saveAuthUser(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.AUTH_USER,
        JSON.stringify(user),
      );
    } catch (error) {
      console.error('Error saving auth user:', error);
      throw error;
    }
  }

  /**
   * Remove authenticated user from storage
   */
  async removeAuthUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEYS.AUTH_USER);
    } catch (error) {
      console.error('Error removing auth user:', error);
      throw error;
    }
  }

  // ========== USER PROFILE OPERATIONS ==========

  /**
   * Get complete user data by UID
   */
  async getUserById(uid: number): Promise<UserData | null> {
    const cacheKey = `user_${uid}_complete`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const [profileData, goalsData, settingsData, statsData] =
        await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEYS.PROFILE(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.GOALS(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.SETTINGS(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.STATS(uid)),
        ]);

      const profile = profileData ? JSON.parse(profileData) : null;

      if (!profile) {
        return null;
      }

      const goals = goalsData ? JSON.parse(goalsData) : DEFAULT_USER_GOALS;
      const settings = settingsData
        ? JSON.parse(settingsData)
        : DEFAULT_USER_SETTINGS;
      const stats = statsData ? JSON.parse(statsData) : DEFAULT_USER_STATS;
      const userData: UserData = {
        id: uid,
        profile,
        goals,
        settings,
        stats,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.cache.set(cacheKey, userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Get user profile only
   */
  async getUserProfile(uid: number): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.PROFILE(uid),
      );
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get user goals only
   */
  async getUserGoals(uid: number): Promise<UserGoals> {
    try {
      const goalsData = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.GOALS(uid),
      );
      return goalsData ? JSON.parse(goalsData) : DEFAULT_USER_GOALS;
    } catch (error) {
      console.error('Error getting user goals:', error);
      return DEFAULT_USER_GOALS;
    }
  }

  /**
   * Get user settings only
   */
  async getUserSettings(uid: number): Promise<UserSettings> {
    try {
      const settingsData = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.SETTINGS(uid),
      );
      return settingsData ? JSON.parse(settingsData) : DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /**
   * Get user statistics only
   */
  async getUserStats(uid: number): Promise<UserStats> {
    try {
      const statsData = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.STATS(uid),
      );
      return statsData ? JSON.parse(statsData) : DEFAULT_USER_STATS;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return DEFAULT_USER_STATS;
    }
  }

  // ========== CREATE/UPDATE OPERATIONS ==========

  /**
   * Create a new user with all data
   */
  async createUser(
    uid: number,
    profile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>,
    goals?: Partial<UserGoals>,
    settings?: Partial<UserSettings>,
  ): Promise<UserData> {
    try {
      const now = new Date().toISOString();

      const userProfile: UserProfile = {
        uid,
        ...profile,
        memberSince:
          profile.memberSince ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
        createdAt: now,
        updatedAt: now,
      };

      const userGoals = {...DEFAULT_USER_GOALS, ...goals};
      const userSettings = {...DEFAULT_USER_SETTINGS, ...settings};
      const userStats = DEFAULT_USER_STATS;

      await Promise.all([
        AsyncStorage.setItem(
          USER_STORAGE_KEYS.PROFILE(uid),
          JSON.stringify(userProfile),
        ),
        AsyncStorage.setItem(
          USER_STORAGE_KEYS.GOALS(uid),
          JSON.stringify(userGoals),
        ),
        AsyncStorage.setItem(
          USER_STORAGE_KEYS.SETTINGS(uid),
          JSON.stringify(userSettings),
        ),
        AsyncStorage.setItem(
          USER_STORAGE_KEYS.STATS(uid),
          JSON.stringify(userStats),
        ),
      ]);

      // Clear cache
      this.clearUserCache(uid);
      return {
        id: uid,
        profile: userProfile,
        goals: userGoals,
        settings: userSettings,
        stats: userStats,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: number, updates: UserUpdateData): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile(uid);
      if (!currentProfile) {
        throw new Error('User profile not found');
      }

      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.PROFILE(uid),
        JSON.stringify(updatedProfile),
      );

      this.clearUserCache(uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user goals
   */
  async updateUserGoals(uid: number, updates: UserGoalsUpdate): Promise<void> {
    try {
      const currentGoals = await this.getUserGoals(uid);
      const updatedGoals = {...currentGoals, ...updates};

      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.GOALS(uid),
        JSON.stringify(updatedGoals),
      );

      this.clearUserCache(uid);
    } catch (error) {
      console.error('Error updating user goals:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    uid: number,
    updates: UserSettingsUpdate,
  ): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings(uid);
      const updatedSettings = {...currentSettings, ...updates};

      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.SETTINGS(uid),
        JSON.stringify(updatedSettings),
      );

      this.clearUserCache(uid);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(
    uid: number,
    updates: Partial<UserStats>,
  ): Promise<void> {
    try {
      const currentStats = await this.getUserStats(uid);
      const updatedStats = {...currentStats, ...updates};

      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.STATS(uid),
        JSON.stringify(updatedStats),
      );

      this.clearUserCache(uid);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // ========== UTILITY OPERATIONS ==========

  /**
   * Get display name for user
   */
  getDisplayName(profile: UserProfile): string {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile.username || profile.email.split('@')[0];
  }

  /**
   * Get user initials
   */
  getUserInitials(profile: UserProfile): string {
    const displayName = this.getDisplayName(profile);
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Check if user profile is complete
   */
  isProfileComplete(profile: UserProfile): boolean {
    const requiredFields = ['username', 'email', 'phoneNumber'];
    return requiredFields.every(field => profile[field as keyof UserProfile]);
  }

  /**
   * Clear user cache
   */
  private clearUserCache(uid: number): void {
    this.cache.delete(`user_${uid}_complete`);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  /**
   * Initialize default data for a user if it doesn't exist
   */
  async initializeUserDataIfNeeded(uid: number): Promise<void> {
    try {
      const [profileExists, goalsExists, settingsExists, statsExists] =
        await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEYS.PROFILE(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.GOALS(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.SETTINGS(uid)),
          AsyncStorage.getItem(USER_STORAGE_KEYS.STATS(uid)),
        ]);

      const promises: Promise<void>[] = [];

      // Initialize default profile if it doesn't exist
      if (!profileExists) {
        const now = new Date().toISOString();
        const defaultProfile: UserProfile = {
          uid,
          username: 'Mohamed Hijaz',
          email: 'mohamed.hijaz@example.com',
          phoneNumber: '+1234567890',
          firstName: 'Mohamed',
          lastName: 'Hijaz',
          location: 'Gothatuwa, Sri Lanka',
          address: 'Gothatuwa, Colombo',
          masjid: 'Masjid Ul Jabbar Jumma Masjid',
          memberSince: 'Sep 2024',
          createdAt: now,
          updatedAt: now,
        };
        promises.push(
          AsyncStorage.setItem(
            USER_STORAGE_KEYS.PROFILE(uid),
            JSON.stringify(defaultProfile),
          ),
        );
      }

      if (!goalsExists) {
        promises.push(
          AsyncStorage.setItem(
            USER_STORAGE_KEYS.GOALS(uid),
            JSON.stringify(DEFAULT_USER_GOALS),
          ),
        );
      }

      if (!settingsExists) {
        const defaultSettings = {
          ...DEFAULT_USER_SETTINGS,
          location: 'Gothatuwa, Sri Lanka',
          masjid: 'Masjid Ul Jabbar Jumma Masjid',
        };
        promises.push(
          AsyncStorage.setItem(
            USER_STORAGE_KEYS.SETTINGS(uid),
            JSON.stringify(defaultSettings),
          ),
        );
      }

      if (!statsExists) {
        promises.push(
          AsyncStorage.setItem(
            USER_STORAGE_KEYS.STATS(uid),
            JSON.stringify(DEFAULT_USER_STATS),
          ),
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data
   */
  async deleteUserData(uid: number): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_STORAGE_KEYS.PROFILE(uid)),
        AsyncStorage.removeItem(USER_STORAGE_KEYS.GOALS(uid)),
        AsyncStorage.removeItem(USER_STORAGE_KEYS.SETTINGS(uid)),
        AsyncStorage.removeItem(USER_STORAGE_KEYS.STATS(uid)),
      ]);

      this.clearUserCache(uid);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}

export default UnifiedUserService;
