import React, {useEffect} from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAnimationComplete}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Simple fade-in animation
    const startAnimation = () => {
      opacity.value = withTiming(1, {duration: 400});

      // After animation completes, trigger callback
      setTimeout(() => {
        runOnJS(onAnimationComplete)();
      }, 1500);
    };

    // Small delay before starting animation
    const timer = setTimeout(startAnimation, 200);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <>
      {' '}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent={false}
      />
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <SvgIcon name="fajrlogo" size={220} color={colors.primary} />
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
