/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {PropsWithChildren, useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import PrayerTimeScreen from './src/screens/PrayerTimeScreen';
import DatabaseTestScreen from './src/screens/DatabaseTestScreen';
import PrayerChallengeScreen from './src/screens/PrayerChallengeScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import {DatabaseProvider} from './src/services/db/databaseProvider';

import {NavigationContainer} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

// Define screen names and their params
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  OTP: {email: string};
  MainApp: undefined;
  DatabaseTest: undefined;
  PrayerChallenge: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isShowingSplash, setIsShowingSplash] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setInitialRoute(hasSeenOnboarding ? 'Login' : 'Onboarding');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setInitialRoute('Onboarding');
    }
  };

  const handleSplashComplete = () => {
    setIsShowingSplash(false);
  };

  const backgroundStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // Show splash screen first
  if (isShowingSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  if (!initialRoute) {
    return <></>; // empty fragment instead of null
  }

  return (
    <DatabaseProvider>
      <NavigationContainer>
        <SafeAreaView style={backgroundStyle}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <Stack.Navigator
            initialRouteName={initialRoute as keyof RootStackParamList}
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="OTP"
              component={OTPScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="MainApp"
              component={BottomTabNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="DatabaseTest"
              component={DatabaseTestScreen}
              options={{
                headerShown: true,
                title: 'Database Test',
              }}
            />
            <Stack.Screen
              name="PrayerChallenge"
              component={PrayerChallengeScreen}
              options={{
                headerShown: true,
                title: 'Prayer Challenge',
              }}
            />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  topNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Pushes title/empty space to left, button to right
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15, // Add horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: Colors.light, // Adjust color as needed
    // backgroundColor: 'transparent', // Or a specific color
  },
  topNavTitleContainer: {
    flex: 1, // Allows this to take up space if a title is added
  },
  translateButton: {
    padding: 10, // Adjusted padding for a more icon-like button
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButtonText: {
    fontSize: 18, // Adjust size as needed for an icon
    fontWeight: 'bold', // Make it bold to appear more like an icon
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light, // Adjust color as needed
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // Color will be handled by parent Text in Section or globally
  },
  contentContainer: {
    flex: 1,
    // paddingHorizontal: '5%', // You can use safePadding logic here if needed
  },
});

export default App;
