import {z} from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .trim();

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number');

// Phone number validation schema
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[\+]?[1-9][\d]{8,14}$/, 'Please enter a valid phone number')
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number cannot exceed 15 digits')
  .transform(val => val.replace(/\s+/g, '')); // Remove spaces

// OTP validation schema
export const otpSchema = z
  .string()
  .length(4, 'OTP must be exactly 4 digits')
  .regex(/^\d{4}$/, 'OTP must contain only numbers');

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
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
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: phoneSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PhoneVerificationData = z.infer<typeof phoneVerificationSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
