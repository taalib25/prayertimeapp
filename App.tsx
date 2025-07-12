import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  useColorScheme,
  StyleSheet,
} from 'react-native';
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
import RegisterScreen from './src/screens/RegisterScreen';
import OTPScreen from './src/screens/OTPScreen';
import FakeCallScreen from './src/screens/FakeCallScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import CallerSettingScreen from './src/screens/CallerSettingScreen';
import PickupSettingsScreen from './src/screens/PickupSettingsScreen';
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
import PermissionInitializer from './src/services/PermissionInitializer';
import {colors} from './src/utils/theme';
import FeedsScreen from './src/screens/FeedsScreen';
import DatabaseScreen from './src/screens/DatabaseScreen';
// Types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OTP: {email: string; username?: string; password?: string};
  MainApp: undefined;
  DatabaseScreen: undefined;
  PrayerChallenge: undefined;
  FakeCallScreen: undefined;
  Feeds: undefined;
  NotificationScreen: undefined;
  EditProfileScreen: undefined;
  CallerSettings: undefined;
  PickupSettings: undefined;
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

  // Initialize app data and permissions on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize permissions early
        const permissionInitializer = PermissionInitializer.getInstance();
        await permissionInitializer.initializeAppPermissions();

        // Initialize other app data
        await Promise.all([
          checkOnboardingStatus(),
          initializePrayerTimesDatabase(),
        ]);
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };

    initializeApp();
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
    return <View style={styles.loadingContainer} />;
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
            <Stack.Screen
              name="Feeds"
              component={FeedsScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="NotificationScreen"
              component={NotificationScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="EditProfileScreen"
              component={EditProfileScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="CallerSettings"
              component={CallerSettingScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="PickupSettings"
              component={PickupSettingsScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="DatabaseScreen"
              component={DatabaseScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
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
            <Stack.Screen name="Register" component={RegisterScreen} />
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
        <SafeAreaView style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lighter,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default App;
