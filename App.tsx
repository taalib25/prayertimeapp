/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import {DatabaseProvider} from './src/services/db/databaseProvider';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

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

function AppNavigator() {
  const {isAuthenticated, isLoading} = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showingSplash, setShowingSplash] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleAuthCheck = (authenticated: boolean) => {
    setShowingSplash(false);
  };

  // Show splash screen while checking auth and onboarding
  if (showingSplash) {
    return <SplashScreen onAuthCheck={handleAuthCheck} />;
  }

  // Still loading state
  if (isLoading || isCheckingOnboarding || hasSeenOnboarding === null) {
    return null; // or a loading indicator
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <DatabaseProvider>
      <AuthProvider>
        <SafeAreaView style={backgroundStyle}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <AppNavigator />
        </SafeAreaView>
      </AuthProvider>
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
