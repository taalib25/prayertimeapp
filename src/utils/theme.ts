export const colors = {
  primary: '#1B5E20', // Dark green
  primaryLight: '#2E7D32', // Medium green
  accent: '#4CAF50', // Green
  accentLight: '#66BB6A', // Light green
  white: '#FFFFFF',

  // Enhanced green palette
  emerald: '#10B981', // Emerald green
  jade: '#059669', // Jade green
  mint: '#6EE7B7', // Mint green
  sage: '#A7F3D0', // Sage green
  forest: '#064E3B', // Forest green
  lime: '#84CC16', // Lime green

  text: {
    primary: '#FFFFFF',
    secondary: '#A5D6A7', // Light green for secondary text
    accent: '#81C784', // Light green accent
    dark: '#1F2937', // Dark text
    muted: '#6B7280', // Muted text
  },
  background: {
    dark: '#1B4332', // Dark forest green
    card: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(27, 94, 32, 0.5)', // Green overlay
    light: '#F0FDF4', // Very light green
    surface: '#ECFDF5', // Light green surface
  },

  // Status colors in green theme
  success: '#10B981',
  warning: '#84CC16',
  error: '#DC2626',
  info: '#059669',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export default {
  colors,
  shadows,
  spacing,
  borderRadius,
};
