/**
 * Simple User Service
 * Manages user data and system data with just two storage keys
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  SystemData,
  DEFAULT_USER,
  DEFAULT_SYSTEM,
  STORAGE_KEYS,
  UserUpdate,
  SystemUpdate,
} from '../types/User';
import prayerTimes from '../types/prayer_times.json';

class UserService {
  private static instance: UserService;
  private userCache: User | null = null;
  private systemCache: SystemData | null = null;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // ========== USER DATA METHODS ==========

  /**
   * Get user data
   */
  async getUser(): Promise<User> {
    if (this.userCache) {
      return this.userCache;
    }

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const user = JSON.parse(userData);
        this.userCache = user;
        return user;
      }

      // Return default user if none exists
      const defaultUser = {...DEFAULT_USER};
      await this.saveUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error('Error getting user:', error);
      return {...DEFAULT_USER};
    }
  }

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<void> {
    try {
      const userToSave = {
        ...user,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSave));
      this.userCache = userToSave;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Update user data
   */
  async updateUser(updates: UserUpdate): Promise<User> {
    try {
      const currentUser = await this.getUser();
      const updatedUser = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Create user with initial data
   */
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const now = new Date().toISOString();
      const newUser: User = {
        ...DEFAULT_USER,
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      await this.saveUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // ========== SYSTEM DATA METHODS ==========

  /**
   * Get system data
   */
  async getSystemData(): Promise<SystemData> {
    if (this.systemCache) {
      return this.systemCache;
    }

    try {
      const systemData = await AsyncStorage.getItem(STORAGE_KEYS.SYSTEM);
      if (systemData) {
        const system = JSON.parse(systemData);
        this.systemCache = system;
        return system;
      }

      // Return default system data if none exists
      const defaultSystem = {...DEFAULT_SYSTEM};
      await this.saveSystemData(defaultSystem);
      return defaultSystem;
    } catch (error) {
      console.error('Error getting system data:', error);
      return {...DEFAULT_SYSTEM};
    }
  }

  /**
   * Save system data
   */
  async saveSystemData(systemData: SystemData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYSTEM,
        JSON.stringify(systemData),
      );
      this.systemCache = systemData;
    } catch (error) {
      console.error('Error saving system data:', error);
      throw error;
    }
  }

  /**
   * Update system data
   */
  async updateSystemData(updates: SystemUpdate): Promise<SystemData> {
    try {
      const currentSystem = await this.getSystemData();
      const updatedSystem = {
        ...currentSystem,
        ...updates,
      };

      await this.saveSystemData(updatedSystem);
      return updatedSystem;
    } catch (error) {
      console.error('Error updating system data:', error);
      throw error;
    }
  }

  // ========== AUTH METHODS ==========

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const systemData = await this.getSystemData();
    return !!systemData.authToken;
  }

  /**
   * Set auth token
   */
  async setAuthToken(token: string): Promise<void> {
    await this.updateSystemData({authToken: token});
  }

  /**
   * Clear auth token
   */
  async clearAuthToken(): Promise<void> {
    await this.updateSystemData({authToken: null});
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    const systemData = await this.getSystemData();
    return systemData.authToken;
  }

  // ========== ONBOARDING METHODS ==========

  /**
   * Check if user has seen onboarding
   */
  async hasSeenOnboarding(): Promise<boolean> {
    const systemData = await this.getSystemData();
    return systemData.hasSeenOnboarding;
  }

  /**
   * Mark onboarding as seen
   */
  async markOnboardingAsSeen(): Promise<void> {
    await this.updateSystemData({hasSeenOnboarding: true});
  }

  /**
   * Check if user has seen profile alert
   */
  async hasSeenProfileAlert(): Promise<boolean> {
    const systemData = await this.getSystemData();
    return systemData.hasSeenProfileAlert;
  }

  /**
   * Mark profile alert as seen
   */
  async markProfileAlertAsSeen(): Promise<void> {
    await this.updateSystemData({hasSeenProfileAlert: true});
  }

  // ========== CALL PREFERENCE METHODS ==========

  /**
   * Get call preference
   */
  async getCallPreference(): Promise<boolean | null> {
    const systemData = await this.getSystemData();
    return systemData.callPreference;
  }

  /**
   * Set call preference
   */
  async setCallPreference(preference: boolean): Promise<void> {
    await this.updateSystemData({callPreference: preference});
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get display name
   */
  getDisplayName(user: User): string {
    return user.username || user.email.split('@')[0] || 'User';
  }

  /**
   * Get user initials
   */
  getUserInitials(user: User): string {
    const displayName = this.getDisplayName(user);
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.userCache = null;
    this.systemCache = null;
  }

  /**
   * Clear all data (logout)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.SYSTEM),
      ]);
      this.clearCache();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Initialize with default data if needed
   */
  async initializeIfNeeded(): Promise<void> {
    try {
      // This will create default data if none exists
      await this.getUser();
      const systemData = await this.getSystemData();
      await this.loadPrayerTimes();
      // Reset profile alert flag on app start for session-based tracking
      if (systemData.hasSeenProfileAlert) {
        await this.updateSystemData({hasSeenProfileAlert: false});
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      throw error;
    }
  }

  /**
   * Load prayer times JSON data into system data
   */
  async loadPrayerTimes(): Promise<void> {
    try {
      // Save the entire prayer times JSON data in system storage
      const systemData = await this.getSystemData();
      const updatedSystemData = {
        ...systemData,
        prayerTimesData: prayerTimes, // Store the entire JSON
        prayerTimes: [], // Keep this empty, we'll use the method below to get specific dates
      };
      await this.saveSystemData(updatedSystemData);
    } catch (error) {
      console.error('Error loading prayer times:', error);
      throw error;
    }
  }

  /**
   * Simple function to get prayer times for a specific date
   * @param date String in format "YYYY-MM-DD"
   * @returns Prayer times object or null if not found
   */
  async getPrayerTimesForDate(
    date: string,
  ): Promise<SystemData['prayerTimes'][0] | null> {
    try {
      // First try to get from storage
      const systemData = await this.getSystemData();
      if (systemData.prayerTimesData) {
        const [, monthStr, dayStr] = date.split('-');
        const month = parseInt(monthStr);
        const day = parseInt(dayStr);

        const monthNames = [
          'january',
          'february',
          'march',
          'april',
          'may',
          'june',
          'july',
          'august',
          'september',
          'october',
          'november',
          'december',
        ];

        const monthName = monthNames[month - 1];
        const monthData =
          systemData.prayerTimesData.monthly_prayer_times?.[monthName];

        if (monthData) {
          const dateRange = monthData.date_ranges.find((range: any) => {
            const fromDay = parseInt(range.from_date.split('-')[0]);
            const toDay = parseInt(range.to_date.split('-')[0]);
            return day >= fromDay && day <= toDay;
          });

          if (dateRange) {
            return {
              date,
              fajr: dateRange.times.fajr,
              dhuhr: dateRange.times.luhr,
              asr: dateRange.times.asr,
              maghrib: dateRange.times.magrib,
              isha: dateRange.times.isha,
            };
          }
        }
      }

      // Fallback to imported JSON
      return this.getPrayerTimesFromImportedJSON(date);
    } catch (error) {
      console.error(`Error getting prayer times for date ${date}:`, error);
      return null;
    }
  }

  /**
   * Get prayer times from imported JSON file
   * @param date String in format "YYYY-MM-DD"
   * @returns Prayer times for the specified date or null if not found
   */
  private getPrayerTimesFromImportedJSON(
    date: string,
  ): SystemData['prayerTimes'][0] | null {
    try {
      const [, monthStr, dayStr] = date.split('-');
      const month = parseInt(monthStr);
      const day = parseInt(dayStr);

      const monthNames = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ];

      const monthName = monthNames[month - 1];
      if (!monthName) return null;

      const monthData = (prayerTimes.monthly_prayer_times as any)[monthName];
      if (!monthData) return null;

      const dateRange = monthData.date_ranges.find((range: any) => {
        const fromDay = parseInt(range.from_date.split('-')[0]);
        const toDay = parseInt(range.to_date.split('-')[0]);
        return day >= fromDay && day <= toDay;
      });

      if (!dateRange) return null;

      return {
        date,
        fajr: dateRange.times.fajr,
        dhuhr: dateRange.times.luhr,
        asr: dateRange.times.asr,
        maghrib: dateRange.times.magrib,
        isha: dateRange.times.isha,
      };
    } catch (error) {
      console.error(
        `Error getting prayer times from imported JSON for date ${date}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Load prayer times for a specific date into system data
   */
  async loadPrayerTimeForDate(date: string): Promise<void> {
    try {
      const prayerTime = await this.getPrayerTimesForDate(date);
      if (!prayerTime) {
        console.warn(`No prayer times found for date: ${date}`);
        return;
      }

      const systemData = await this.getSystemData();
      // Filter out any existing entry for this date
      const filteredPrayerTimes = systemData.prayerTimes.filter(
        pt => pt.date !== date,
      );

      const updatedSystemData = {
        ...systemData,
        prayerTimes: [...filteredPrayerTimes, prayerTime],
      };

      await this.saveSystemData(updatedSystemData);
    } catch (error) {
      console.error('Error loading prayer time for date:', error);
      throw error;
    }
  }
}

export default UserService;
