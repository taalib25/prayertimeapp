import {TextStyle} from 'react-native';

// export const fontWeights = {
//   light: '300' as const,
//   regular: '400' as const,
//   medium: '500' as const,
//   semibold: '600' as const,
//   bold: '700' as const,
//   extrabold: '800' as const,
// };

// Static font families for different weights
const fontFamilies = {
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
    lineHeight: 28,
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
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 16,
  },
  bodyTiny: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 16,
  },

  //Header Profile
  headerProfile: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
  },

  prayerCard: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
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
    fontSize: 17,
    lineHeight: 14.7, // 105% of 14px
    letterSpacing: 0.07, // 0.5% of 14px
  },
};
