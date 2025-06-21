/**
 * Simplified User System
 * One user type with only essential fields
 * No need for multiple sub-types or complex categorization
 */

// Pickup assistance settings interface
export interface PickupSettings {
  enabled: boolean;
  preferredTime: string;
  emergencyContact: string;
  specificLocation: string;
  notes: string;
  availableDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

// Main user interface - contains everything about the user
export interface User {
  // Basic profile info
  username: string;
  email: string;
  phoneNumber: string;

  // Profile details
  mobility?: string;
  mobilityOther?: string; // For "other" mobility option

  // Additional information flags
  livingOnRent?: boolean;
  zakatEligible?: boolean;
  differentlyAbled?: boolean;
  muallafathiQuloob?: boolean; // Convert

  // Simple targets (only zikr and quran as requested)
  zikriGoal: number; // monthly target
  quranGoal: number; // monthly pages target

  // Simple settings by default
  location: string;
  masjid: string;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// System data - separate key for system-related data
export interface SystemData {
  authToken: string | null;
  hasSeenOnboarding: boolean;
  callPreference: boolean | null;
  pickupSettings: PickupSettings | null; // Detailed pickup settings for request system
  fajrReminderDuration: number | null; // Duration in minutes
  fajrReminderTiming: 'before' | 'after' | null; // Before or after Fajr
}

// Default values
export const DEFAULT_USER: User = {
  username: 'User',
  email: 'user@example.com',
  phoneNumber: '',
  mobility: undefined,
  mobilityOther: '',
  livingOnRent: false,
  zakatEligible: false,
  differentlyAbled: false,
  muallafathiQuloob: false,
  zikriGoal: 600,
  quranGoal: 300,
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
  pickupSettings: null,
  fajrReminderDuration: null,
  fajrReminderTiming: null,
};

// Storage keys - only two keys needed
export const STORAGE_KEYS = {
  USER: 'user_data', // All user profile and settings
  SYSTEM: 'system_data', // Auth token, onboarding, call preference
} as const;

// Helper types for partial updates
export type UserUpdate = Partial<Omit<User, 'createdAt' | 'updatedAt'>>;
export type SystemUpdate = Partial<SystemData>;
