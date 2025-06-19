import {TextStyle} from 'react-native';

// Static font families for different weights
export const fontFamilies = {
  light: 'Sora-Light',
  regular: 'Sora-Regular',
  medium: 'Sora-Medium',
  semibold: 'Sora-SemiBold',
  bold: 'Sora-Bold',
  extrabold: 'Sora-ExtraBold',
};

export const typography: Record<string, TextStyle> = {
  // Headers
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 28, // Fixed line height for better layout
  },

  // Body text
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 20, // Fixed line height
  },
  bodyTiny: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18, // Fixed line height
  },

  //Header Profile
  headerProfile: {
    fontFamily: fontFamilies.semibold,
    fontSize: 22,
    lineHeight: 28,
  },

  prayerCard: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 20,
  },

  // UI elements
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
  },

  count: {
    fontFamily: fontFamilies.semibold,
    fontSize: 32,
    lineHeight: 40,
  },

  // Stats and numbers
  statNumber: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
  },

  // Task Progress
  taskTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.07,
  },

  // OTP Screen typography
  otpTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 34,
  },
};
