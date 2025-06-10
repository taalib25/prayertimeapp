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
    // Start fade in animation immediately
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800, // Faster animation
      useNativeDriver: true,
    }).start();

    // Check authentication status with reduced delay
    const checkAuth = async () => {
      try {
        // Reduced minimum splash screen time for better performance
        const [authResult] = await Promise.all([
          checkAuthState(),
          new Promise(resolve => setTimeout(resolve, 4000)), // Reduced from 6000 to 2000
        ]);

        onAuthCheck(authResult);
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
