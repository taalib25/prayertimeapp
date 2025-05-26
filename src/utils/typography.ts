import {TextStyle} from 'react-native';

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typography: Record<string, TextStyle> = {
  // Headers
  h1: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.semibold,
    fontSize: 20,
    lineHeight: 28,
  },

  // Body text
  body: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Sora-VariableFont_wght',  
    fontWeight: fontWeights.regular,
    fontSize: 15,
    lineHeight: 16,
  },
  bodyTiny: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.regular,
    fontSize: 13,
    lineHeight: 16,
  },

  //Header Profile
  headerProfile: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.semibold,
    fontSize: 18,
  },


  prayerCard: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.bold,
    fontSize: 16,
    lineHeight: 20,
  },

  // UI elements
  button: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
  },

  // Stats and numbers
  statNumber: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.bold,
    fontSize: 28,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: 'Sora-VariableFont_wght',
    fontWeight: fontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
  },
};
