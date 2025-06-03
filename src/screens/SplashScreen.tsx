import React, {useEffect} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {colors} from '../utils/theme';
import {useAuth} from '../contexts/AuthContext';
import SvgIcon from '../components/SvgIcon';

interface SplashScreenProps {
  onAuthCheck: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAuthCheck}) => {
  const {checkAuthState} = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Check authentication status while splash screen is displayed
    const checkAuth = async () => {
      try {
        // Wait for minimum splash screen time and authentication check
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 2000)), // 2 seconds minimum display time
          checkAuthState().then(isAuthenticated => {
            onAuthCheck(isAuthenticated);
          }),
        ]);
      } catch (error) {
        console.error('Error in auth check:', error);
        onAuthCheck(false); // Default to not authenticated if error
      }
    };

    checkAuth();
  }, [fadeAnim, checkAuthState, onAuthCheck]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, {opacity: fadeAnim}]}>
        <SvgIcon name="fajrlogo" size={220} color={colors.primary} />
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default SplashScreen;
