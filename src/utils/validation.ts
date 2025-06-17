import {z} from 'zod';

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

// Phone number validation schema
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^0\d{9}$/,
    'Please enter a valid phone number (10 digits starting with 0)',
  )
  .length(10, 'Phone number must be exactly 10 digits');

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

export type LoginFormData = z.infer<typeof loginSchema>;
export type PhoneVerificationData = z.infer<typeof phoneVerificationSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
