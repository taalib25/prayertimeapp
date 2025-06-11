import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView, StatusBar, View, useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import FakeCallScreen from './src/screens/FakeCallScreen';
// import DatabaseTestScreen from './src/screens/DatabaseTestScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

// Services & Context
import {DatabaseProvider} from './src/services/db/databaseProvider';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {initializePrayerTimesDatabase} from './src/services/db/dbInitalizer';
import {
  initializeUserBackgroundTasks,
  checkBackgroundTasksHealth,
} from './src/services/backgroundTasks';
import {colors} from './src/utils/theme';

// Types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  OTP: {email: string};
  MainApp: undefined;
  // DatabaseTest: undefined;
  PrayerChallenge: undefined;
  FakeCallScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation helpers
export const navigationRef =
  React.createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as any, params);
}

export function goBack() {
  navigationRef.current?.goBack();
}

// Main App Navigator Component
function AppNavigator() {
  const {isAuthenticated, isLoading, checkAuthState} = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showingSplash, setShowingSplash] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Initialize app data on mount
  useEffect(() => {
    Promise.all([checkOnboardingStatus(), initializePrayerTimesDatabase()]);
  }, []);

  // Check auth state after splash
  useEffect(() => {
    if (!showingSplash && !isAuthChecked) {
      checkAuthState().finally(() => setIsAuthChecked(true));
    }
  }, [showingSplash, isAuthChecked, checkAuthState]);

  // Initialize background services when authenticated
  useEffect(() => {
    console.log(
      `Auth state: isAuthenticated=${isAuthenticated}, isLoading=${isLoading}`,
    );
    if (isAuthenticated && !isLoading) {
      console.log('Initializing background services for authenticated user');
      setTimeout(() => initializeUserBackgroundTasks(1001), 300);
    }
  }, [isAuthenticated, isLoading]);

  // Background services initialization
  const initializeBackgroundServices = async () => {
    const defaultUserId = 1001;
    try {
      const isHealthy = await checkBackgroundTasksHealth(defaultUserId);
      if (!isHealthy) {
        await initializeUserBackgroundTasks(defaultUserId);
      }
    } catch (error) {
      console.error('Error initializing background services:', error);
    }
  };

  // Check onboarding status
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

  // Handle onboarding completion
  const handleOnboardingFinish = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      setHasSeenOnboarding(true);
    }
  }, []);

  // Handle splash screen completion
  const handleAuthCheck = () => setShowingSplash(false);

  // Loading states
  if (showingSplash) {
    return <SplashScreen onAuthCheck={handleAuthCheck} />;
  }

  if (isLoading || isCheckingOnboarding || !isAuthChecked) {
    return <View style={{flex: 1, backgroundColor: colors.white}} />;
  }

  // Screen configurations
  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    gestureEnabled: true,
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!hasSeenOnboarding ? (
          // Onboarding Flow
          <Stack.Screen name="Onboarding" options={{gestureEnabled: false}}>
            {props => (
              <OnboardingScreen
                {...props}
                onOnboardingComplete={handleOnboardingFinish}
              />
            )}
          </Stack.Screen>
        ) : isAuthenticated ? (
          // Authenticated User Screens
          <Stack.Group>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            {/* <Stack.Screen
              name="DatabaseTest"
              component={DatabaseTestScreen}
              options={{presentation: 'modal'}}
            /> */}
            <Stack.Screen
              name="FakeCallScreen"
              component={FakeCallScreen}
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animationTypeForReplace: 'push',
              }}
            />
          </Stack.Group>
        ) : (
          // Authentication Screens
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <DatabaseProvider>
      <AuthProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
          }}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
          />
          <AppNavigator />
        </SafeAreaView>
      </AuthProvider>
    </DatabaseProvider>
  );
}

export default App;
