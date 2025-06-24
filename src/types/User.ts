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
  // API response fields
  id: number;
  memberId: string;
  username: string;
  email: string;
  phone: string;
  fullName?: string;

  // Mosque and location info
  mosqueId: number;
  mosqueName: string;
  address?: string;
  area?: string;

  // User attributes
  dateOfBirth?: string;
  mobility?: string;
  role: string;
  status: string;

  // Flags
  onRent: boolean;
  zakathEligible: boolean;
  differentlyAbled: boolean;
  MuallafathilQuloob: boolean;

  // App-specific settings (will be added locally)
  zikriGoal: number; // monthly target
  quranGoal: number; // monthly pages target
  theme: 'light' | 'dark';
  language: 'en' | 'ar';

  // Timestamps
  joinedDate: string;
  lastLogin: string;
  createdAt?: string;
  updatedAt?: string;
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

// Default values - removed mock fallbacks to ensure only real API data is used
export const DEFAULT_USER: User = {
  id: 0,
  memberId: '',
  username: '',
  email: '',
  phone: '',
  fullName: '',
  mosqueId: 0,
  mosqueName: '', // No fallback - use empty string for real API data only
  address: '',
  area: '',
  dateOfBirth: '',
  mobility: '',
  role: 'Member',
  status: 'active',
  onRent: false,
  zakathEligible: false,
  differentlyAbled: false,
  MuallafathilQuloob: false,
  zikriGoal: 600,
  quranGoal: 300,
  theme: 'light',
  language: 'en',
  joinedDate: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
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
