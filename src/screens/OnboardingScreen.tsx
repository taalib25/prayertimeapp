import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SimpleUserService from '../services/SimpleUserService';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
  onOnboardingComplete: () => Promise<void>; // New prop
}

const OnboardingScreen: React.FC<Props> = ({
  navigation,
  onOnboardingComplete,
}) => {
  const userService = SimpleUserService.getInstance();

  const handleStartNow = async () => {
    try {
      await userService.markOnboardingAsSeen();
      await onOnboardingComplete();
    } catch (error) {
      console.error('Error during onOnboardingComplete:', error);
      // Handle error if the callback itself throws one, though unlikely with current setup.
    }
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={require('../assets/images/welcome.png')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <SafeAreaView style={styles.safeAreaContainer}>
          <View style={styles.buttonWrapper}>
            <CustomButton
              title="Get Started"
              onPress={handleStartNow}
              style={styles.startButton}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeAreaContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    justifyContent: 'flex-end', // Push content to bottom
  },
  buttonWrapper: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 60,
    width: '100%',
  },
  startButton: {
    backgroundColor: colors.primaryMain,
    borderRadius: 12,
    height: 56,
  },
});

export default OnboardingScreen;
