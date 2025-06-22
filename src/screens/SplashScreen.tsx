import React, {useEffect} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {colors} from '../utils/theme';
import SvgIcon from '../components/SvgIcon';
import UserService from '../services/UserService';
import {initializePrayerTimesDatabase} from '../services/db/dbInitalizer';
import {getPrayerTimesForDate} from '../services/db/PrayerServices';
import {getTodayDateString} from '../utils/helpers';
import {performanceMonitor} from '../utils/performance';

interface SplashScreenProps {
  onAuthCheck: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAuthCheck}) => {
  const userService = UserService.getInstance();
  const fadeAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    performanceMonitor.start('splash_screen_total');
    // Start fade in animation immediately
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800, // Faster animation
      useNativeDriver: true,
    }).start(); // Check authentication status with data preloading
    const checkAuth = async () => {
      try {
        console.log('🚀 Starting splash screen data preloading...');
        performanceMonitor.start('data_preloading');
        // Start all critical data loading in parallel with more aggressive caching
        const [authResult, , , prayerData] = await Promise.all([
          userService.isAuthenticated(),
          // Preload critical data during splash
          initializePrayerTimesDatabase(),
          userService.initializeIfNeeded(),
          // Preload and cache today's prayer times
          getPrayerTimesForDate(getTodayDateString()),
          // Reduced splash time for faster loading
          new Promise(resolve => setTimeout(resolve, 1800)), // Further reduced from 2500
        ]); // Cache prayer data globally for immediate access
        if (prayerData) {
          (global as any).cachedTodayPrayerTimes = prayerData;
        }

        performanceMonitor.end('data_preloading');
        performanceMonitor.end('splash_screen_total');
        console.log('✅ Splash screen data preloading completed');
        onAuthCheck(authResult);
      } catch (error) {
        console.error('Error in auth check:', error);
        performanceMonitor.end('data_preloading');
        performanceMonitor.end('splash_screen_total');
        onAuthCheck(false); // Default to not authenticated if error
      }
    };

    checkAuth();
  }, [fadeAnim, userService, onAuthCheck]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, {opacity: fadeAnim}]}>
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
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});

export default SplashScreen;
