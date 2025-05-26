export const colors = {
  primary: '#242A4E',
  primaryLight: '#2E3971',
  accent: '#28999B',
  accentLight: '#42D0D3',
  white: '#FFFFFF',
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B8D3',
    accent: '#5CE5D5',
  },
  background: {
    dark: '#21213C',
    card: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(66, 78, 141, 0.5)',
  },
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
