/**
 * Unified User Type Definitions
 * This file contains all user-related interfaces and types used across the app
 * to ensure consistency and type safety
 */

// Base user information for authentication
export interface AuthUser {
  id: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  name?: string;
  createdAt: string;
}

// Extended user profile information
export interface UserProfile {
  uid: number;
  username: string;
  email: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  profileImage?: string;
  location?: string;
  address?: string;
  masjid?: string;
  memberSince?: string;
  createdAt: string;
  updatedAt: string;
}

// User goals and targets
export interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

// User app settings and preferences
export interface UserSettings {
  prayerSettings: string;
  preferredMadhab: string;
  appLanguage: string;
  theme: string;
  location?: string;
  masjid?: string;
  notifications?: {
    enabled: boolean;
    prayerReminders: boolean;
    sound: string;
    vibration: boolean;
  };
}

// Complete user data structure
export interface UserData {
  id: number;
  profile: UserProfile;
  goals: UserGoals;
  settings: UserSettings;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}

// User statistics and progress
export interface UserStats {
  fajrCount: number;
  dhuhrCount: number;
  asrCount: number;
  maghribCount: number;
  ishaCount: number;
  zikriCount: number;
  quranMinutes: number;
  charityAmount: number;
  fastingDays: number;
  streakDays: number;
  totalPrayers: number;
  badges: UserBadge[];
}

// User badge information
export interface UserBadge {
  id: string;
  title: string;
  description?: string;
  icon: string;
  isEarned: boolean;
  earnedAt?: string;
  category: 'prayer' | 'quran' | 'zikr' | 'charity' | 'fasting' | 'special';
}

// Default values
export const DEFAULT_USER_GOALS: UserGoals = {
  monthlyZikrGoal: 1000,
  monthlyQuranPagesGoal: 30,
  monthlyCharityGoal: 100,
  monthlyFastingDaysGoal: 15,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  prayerSettings: JSON.stringify({
    method: 'ISNA',
    notifications: true,
    sound: 'adhan1',
  }),
  preferredMadhab: 'Hanafi',
  appLanguage: 'en',
  theme: 'light',
  notifications: {
    enabled: true,
    prayerReminders: true,
    sound: 'adhan',
    vibration: true,
  },
};

export const DEFAULT_USER_STATS: UserStats = {
  fajrCount: 0,
  dhuhrCount: 0,
  asrCount: 0,
  maghribCount: 28,
  ishaCount: 20,
  zikriCount: 154,
  quranMinutes: 300,
  charityAmount: 0,
  fastingDays: 0,
  streakDays: 0,
  totalPrayers: 0,
  badges: [
    {
      id: '1',
      title: 'Challenge 40',
      description: 'Completed 40 consecutive prayers',
      icon: 'mosque',
      isEarned: true,
      earnedAt: new Date().toISOString(),
      category: 'prayer',
    },
    {
      id: '2',
      title: 'Zikr Star',
      description: 'Completed 100 zikr sessions',
      icon: 'prayer-beads',
      isEarned: true,
      earnedAt: new Date().toISOString(),
      category: 'zikr',
    },
    {
      id: '3',
      title: 'Recite Master',
      description: 'Read 30 pages of Quran',
      icon: 'quran',
      isEarned: false,
      category: 'quran',
    },
    // {
    //   id: '4',
    //   title: 'Early Bird',
    //   description: 'Prayed Fajr for 7 consecutive days',
    //   icon: 'fajr',
    //   isEarned: true,
    //   earnedAt: new Date().toISOString(),
    //   category: 'prayer',
    // },
  ],
};

// Helper types
export type UserUpdateData = Partial<UserProfile>;
export type UserGoalsUpdate = Partial<UserGoals>;
export type UserSettingsUpdate = Partial<UserSettings>;

// Storage keys
export const USER_STORAGE_KEYS = {
  AUTH_USER: '@prayer_app_user',
  PROFILE: (uid: number) => `user_${uid}_profile`,
  GOALS: (uid: number) => `user_${uid}_goals`,
  SETTINGS: (uid: number) => `user_${uid}_settings`,
  STATS: (uid: number) => `user_${uid}_stats`,
  ONBOARDING: 'hasSeenOnboarding',
  CALL_PREFERENCE: 'prayer_app_call_preference',
} as const;
