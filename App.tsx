/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, {useState, useEffect, useCallback} from 'react';

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
import FakeCallScreen from './src/screens/FakeCallScreen';
import DatabaseTestScreen from './src/screens/DatabaseTestScreen';

import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {initializePrayerTimesDatabase} from './src/services/db/dbInitalizer';
import {
  initializeUserBackgroundTasks,
  checkBackgroundTasksHealth,
} from './src/services/backgroundTasks';

// Define screen names and their params
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  OTP: {email: string};
  MainApp: undefined;
  DatabaseTest: undefined;
  PrayerChallenge: undefined;
  FakeCallScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create navigation reference with proper typing
export const navigationRef =
  React.createRef<NavigationContainerRef<RootStackParamList>>();

// Helper function to navigate from anywhere in the app
export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as any, params);
}

export function goBack() {
  navigationRef.current?.goBack();
}

function AppNavigator() {
  const {isAuthenticated, isLoading} = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showingSplash, setShowingSplash] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    initializePrayerTimesDatabase();
  }, []);

  // Initialize background tasks when user becomes authenticated
  useEffect(() => {
    const initializeBackgroundServices = async () => {
      if (isAuthenticated && !isLoading) {
        const defaultUserId = 1001;

        // Check if background tasks are healthy
        const isHealthy = await checkBackgroundTasksHealth(defaultUserId);

        if (!isHealthy) {
          await initializeUserBackgroundTasks(defaultUserId);
        }
      }
    };

    initializeBackgroundServices();
  }, [isAuthenticated, isLoading]);

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

  const handleOnboardingFinish = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      // Optionally, handle the error, e.g., show an alert
      // For now, we'll update the state to proceed in the current session
      setHasSeenOnboarding(true);
    }
  }, [setHasSeenOnboarding]);

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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Navigation is ready - you can add analytics or other initialization here
        console.log('✅ Navigation container ready');
      }}
      onStateChange={state => {
        // Track navigation state changes for analytics and debugging
        console.log(
          '🔄 Navigation state changed:',
          state?.routes?.[state.index]?.name,
        );
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Add smooth animations
          gestureEnabled: true, // Enable swipe gestures
        }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            options={{
              gestureEnabled: false, // Prevent swiping back from onboarding
            }}>
            {props => (
              <OnboardingScreen
                {...props}
                onOnboardingComplete={handleOnboardingFinish}
              />
            )}
          </Stack.Screen>
        ) : isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen
              name="DatabaseTest"
              component={DatabaseTestScreen}
              options={{
                presentation: 'modal', // Present as modal
              }}
            />
            <Stack.Screen
              name="FakeCallScreen"
              component={FakeCallScreen}
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false, // Prevent dismissing fake call screen
                animationTypeForReplace: 'push', // Better animation
              }}
            />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </Stack.Group>
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
