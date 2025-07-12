import {User} from '../types/User';

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  message: string;
}

/**
 * Validates if user profile has all required fields completed
 * Based on EditProfileContext validation requirements
 */
export const validateUserProfile = (
  user: User | null,
): ProfileValidationResult => {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['user_data'],
      message: 'Profile data not found. Please complete your profile.',
    };
  }

  const missingFields: string[] = [];

  // Check required fields based on EditProfileContext validation
  if (!user.firstName?.trim()) {
    missingFields.push('First Name');
  }

  if (!user.lastName?.trim()) {
    missingFields.push('Last Name');
  }

  if (!user.email?.trim()) {
    missingFields.push('Email');
  }

  if (!user.phone?.trim()) {
    missingFields.push('Phone Number');
  }
  if (!user?.address?.trim()) {
    missingFields.push('Address');
  }

  const isComplete = missingFields.length === 0;

  let message = '';
  if (!isComplete) {
    if (missingFields.length === 1) {
      message = `Please complete your ${missingFields[0]} in your profile.`;
    } else if (missingFields.length === 2) {
      message = `Please complete your ${missingFields.join(
        ' and ',
      )} in your profile.`;
    } else {
      message = `Please complete the remaining Details`;
    }
  }

  return {
    isComplete,
    missingFields,
    message,
  };
};

/**
 * Additional validation for optional but important fields
 */
export const validateOptionalProfileFields = (
  user: User | null,
): ProfileValidationResult => {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['user_data'],
      message: 'Profile data not found.',
    };
  }

  const missingFields: string[] = [];

  // Check optional but important fields
  if (!user.address?.trim()) {
    missingFields.push('Address');
  }

  if (!user.dateOfBirth?.trim()) {
    missingFields.push('Date of Birth');
  }

  if (!user.mobility?.trim()) {
    missingFields.push('Mobility Information');
  }

  const isComplete = missingFields.length === 0;

  let message = '';
  if (!isComplete) {
    message = `Consider completing these optional fields for a better experience: ${missingFields.join(
      ', ',
    )}.`;
  }

  return {
    isComplete,
    missingFields,
    message,
  };
};
