import React, {useEffect} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {colors} from '../utils/theme';
import SvgIcon from '../components/SvgIcon';
import UserService from '../services/UserService';
import {getPrayerTimesForDate} from '../services/db/PrayerServices';
import {getTodayDateString} from '../utils/helpers';

interface SplashScreenProps {
  onAuthCheck: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAuthCheck}) => {
  const userService = UserService.getInstance();

  // Animation values for sophisticated logo animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current; // Reduced scaling effect
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create sophisticated logo animation sequence
    const createLogoAnimation = () => {
      return Animated.sequence([
        // Phase 1: Fade in with scale from small to normal
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(1.1)), // Reduced bounce effect
            useNativeDriver: true,
          }),
        ]),
        // Final settle animation
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    };

    // Start logo animation immediately
    createLogoAnimation().start();

    // Check authentication status with data preloading
    const checkAuth = async () => {
      try {
        console.log('🚀 Starting splash screen initialization...');

        // Start all critical data loading in parallel
        const [authResult] = await Promise.all([
          userService.isAuthenticated(),

          userService.initializeIfNeeded(),

          // Minimum splash duration to show logo animation
          new Promise(resolve => setTimeout(resolve, 1800)),
        ]);
        onAuthCheck(authResult);
      } catch (error) {
        console.error('Error during splash initialization:', error);
        onAuthCheck(false); // Default to not authenticated if error
      }
    };

    checkAuth();
  }, [fadeAnim, scaleAnim, rotateAnim, userService, onAuthCheck]);

  // Create rotation interpolation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'], // Subtle rotation instead of full 360
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}, {rotate: rotateInterpolate}],
          },
        ]}>
        <SvgIcon name="fajrlogo" size={240} color={colors.accent} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.02)', // Very subtle green tint
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    // Add subtle shadow for depth
    shadowColor: colors.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    // Ensure logo stays on top
    zIndex: 1,
  },
});

export default SplashScreen;
