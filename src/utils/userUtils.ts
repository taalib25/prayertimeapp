/**
 * User Utility Functions
 * Provides consistent helper functions for user-related operations across the app
 */

import {UserProfile, UserSettings} from '../types/User';

/**
 * Generate display name from user profile data
 * Handles various name formats consistently
 */
export const generateDisplayName = (profile: UserProfile): string => {
  // Priority order: firstName + lastName, username, email prefix
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }

  if (profile.username) {
    return profile.username;
  }

  // Fallback to email prefix
  return profile.email.split('@')[0];
};

/**
 * Generate user initials from display name
 */
export const generateUserInitials = (displayName: string): string => {
  const parts = displayName.split(' ');

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.substring(0, 2).toUpperCase();
};

/**
 * Get mosque information from user data
 */
export const getMosqueInfo = (
  profile?: UserProfile,
  settings?: UserSettings,
) => {
  return {
    name: profile?.masjid || settings?.masjid || 'Local Mosque',
    location: profile?.location || settings?.location || 'Location not set',
  };
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (profile: UserProfile): boolean => {
  const requiredFields = ['username', 'email', 'phoneNumber'];
  const optionalFields = ['address', 'masjid', 'location'];

  const hasRequired = requiredFields.every(
    field => profile[field as keyof UserProfile],
  );
  const hasOptional = optionalFields.some(
    field => profile[field as keyof UserProfile],
  );

  return hasRequired && hasOptional;
};

/**
 * Format member since date consistently
 */
export const formatMemberSince = (memberSince?: string): string => {
  if (!memberSince) {
    return 'Recently';
  }

  // If it's already formatted, return as is
  if (memberSince.includes(' ')) {
    return memberSince;
  }

  // Try to parse and format date
  try {
    const date = new Date(memberSince);
    return date.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
  } catch {
    return memberSince;
  }
};

/**
 * Validate user data consistency
 */
export const validateUserData = (profile: UserProfile): string[] => {
  const errors: string[] = [];

  if (!profile.username || profile.username.length < 2) {
    errors.push('Username must be at least 2 characters');
  }

  if (!profile.email || !profile.email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!profile.phoneNumber || profile.phoneNumber.length < 10) {
    errors.push('Valid phone number is required');
  }

  return errors;
};

/**
 * Default user data constants for consistency
 */
export const DEFAULT_USER_CONSTANTS = {
  AVATAR_PLACEHOLDER: 'U',
  DEFAULT_LOCATION: 'Location not set',
  DEFAULT_MOSQUE: 'Local Mosque',
  DEFAULT_MEMBER_SINCE: 'Recently',
} as const;
