/**
 * Simplified User System
 * One user type with only essential fields
 */

// Main user interface - contains everything about the user
export interface User {
  // Basic profile info
  username: string;
  email: string;
  phoneNumber: string;

  // Simple targets (only zikr and quran)
  zikriGoal: number; // monthly target
  quranGoal: number; // monthly pages target

  // Simple settings
  location: string;
  masjid: string;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// System data - separate from user data
export interface SystemData {
  authToken: string | null;
  hasSeenOnboarding: boolean;
  callPreference: boolean | null;
}

// Default values
export const DEFAULT_USER: User = {
  username: 'User',
  email: 'user@example.com',
  phoneNumber: '',
  zikriGoal: 600,
  quranGoal: 30,
  location: 'Location not set',
  masjid: 'Local Mosque',
  theme: 'light',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_SYSTEM: SystemData = {
  authToken: null,
  hasSeenOnboarding: false,
  callPreference: null,
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'user_data',
  SYSTEM: 'system_data',
} as const;

// Helper types for partial updates
export type UserUpdate = Partial<Omit<User, 'createdAt' | 'updatedAt'>>;
export type SystemUpdate = Partial<SystemData>;
