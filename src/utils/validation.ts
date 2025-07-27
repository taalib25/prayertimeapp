import { z } from 'zod';

// Username validation schema
export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .trim();

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

// Phone number validation schema - Enhanced for international numbers
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^[+]?[\d\s\-()]{8,15}$/,
    'Please enter a valid phone number (8-15 digits, may include +, spaces, dashes, or parentheses)',
  )
  .refine(val => {
    // Remove all non-digit characters to count actual digits
    const digits = val.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }, 'Phone number must contain 8-15 digits');

// OTP validation schema
export const otpSchema = z
  .string()
  .length(4, 'OTP must be exactly 4 digits')
  .regex(/^\d{4}$/, 'OTP must contain only numbers');

// Login form validation schema
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

// Phone verification schema
export const phoneVerificationSchema = z.object({
  phoneNumber: phoneSchema,
});

// OTP verification schema
export const otpVerificationSchema = z.object({
  otp: otpSchema,
});

// Combined validation for full user registration
export const userRegistrationSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  phoneNumber: phoneSchema,
});

// Pickup request validation schemas
export const pickupLocationSchema = z
  .string()
  .min(1, 'Pickup location is required')
  .min(5, 'Please provide a more specific location (at least 5 characters)')
  .max(200, 'Location description is too long (maximum 200 characters)')
  .trim();

export const pickupNotesSchema = z
  .string()
  .max(500, 'Special instructions are too long (maximum 500 characters)')
  .optional();

export const pickupDaysSchema = z
  .record(z.boolean())
  .refine(
    days => Object.values(days).some(Boolean),
    'Please select at least one available day',
  );

// Full pickup request validation schema
export const pickupRequestSchema = z.object({
  specificLocation: pickupLocationSchema,
  emergencyContact: phoneSchema,
  notes: pickupNotesSchema,
  availableDays: pickupDaysSchema,
});

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

// Full Name validation schema - replaces firstName/lastName
export const fullNameSchema = z
  .string()
  .min(1, 'Full name is required')
  .min(2, 'Full name must be at least 2 characters')
  .refine(val => val.trim().split(' ').length >= 2, {
    message: 'Please enter your full name (first and last name)',
  });

// Area validation schema
export const areaSchema = z.string().min(1, 'Area is required');

// Updated Registration form validation schema
export const registrationSchema = z.object({
  fullName: fullNameSchema, 
  username: usernameSchema,
  contactNumber: phoneSchema,
  area: areaSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PhoneVerificationData = z.infer<typeof phoneVerificationSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
export type PickupRequestData = z.infer<typeof pickupRequestSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
