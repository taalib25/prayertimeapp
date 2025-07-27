import React, {useState, useEffect} from 'react';
import {
  StatusBar,
  View,
  useColorScheme,
  StyleSheet,
  AppState,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
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
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import FeedsScreen from './src/screens/FeedsScreen';
import DatabaseScreen from './src/screens/DatabaseScreen';

// Services & Context
import {DatabaseProvider} from './src/services/db/databaseProvider';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {colors} from './src/utils/theme';
import PrayerTimeService from './src/services/notifications/prayerTimeService';
import NotificationService from './src/services/notifications/notificationServices';
import PermissionInitializer from './src/services/PermissionInitializer';

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

// Loading component
const LoadingScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.loadingContainer,
      {
        // Only apply bottom safe area, no top padding
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]} />
  );
};

// Main App Navigator Component
function AppNavigator() {
  const {isAuthenticated, isLoading, checkAuthState} = useAuth();
  const [appState, setAppState] = useState({
    showingSplash: true,
    hasSeenOnboarding: null as boolean | null,
    isReady: false,
    isNotificationInitialized: false,
  });
  const [scheduledCount, setScheduledCount] = useState(0);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
    const cleanup = setupAppStateListener();
    return cleanup; // Cleanup on unmount
  }, []);

  // Initialize background services when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && appState.isReady) {
      initializeAuthenticatedServices();
    }
  }, [isAuthenticated, isLoading, appState.isReady]);

  const initializeApp = async () => {
    try {
      console.log(`📱 App launched at ${new Date().toLocaleString()}`);
      // Check onboarding status
      const onboardingValue = await AsyncStorage.getItem('hasSeenOnboarding');
      const hasSeenOnboarding = onboardingValue === 'true';

      setAppState(prev => ({
        ...prev,
        hasSeenOnboarding,
      }));

      // Check auth state
      await checkAuthState();

      // 🚀 Initialize Prayer Notification Service with enhanced logic
      await initializePrayerNotifications();

      setAppState(prev => ({
        ...prev,
        showingSplash: false,
        isReady: true,
      }));
    } catch (error) {
      console.error('❌ App initialization error:', error);
      setAppState(prev => ({
        ...prev,
        hasSeenOnboarding: false,
        showingSplash: false,
        isReady: true,
      }));
    }
  };

  const initializePrayerNotifications = async () => {
    try {
      // 🔍 Smart initialization - check if notifications are properly set up
      const isProperlySetup =
        await PrayerTimeService.checkAndEnsureNotifications();

      if (!isProperlySetup) {
        console.log(
          '🔧 Prayers not properly set up, initializing complete chain...',
        );
        const count = await PrayerTimeService.setupPerpetualChain();
        setScheduledCount(count);
        console.log(
          `✅ Prayer notifications initialized with ${count} notifications`,
        );

        // Log what was scheduled for debugging
        const remaining = await NotificationService.getScheduledNotifications();
        const todayCount = remaining.filter(n => {
          const notifDate = new Date(n.trigger.timestamp);
          const today = new Date();
          return notifDate.toDateString() === today.toDateString();
        }).length;

        console.log(
          `📅 Scheduled: ${todayCount} for today, ${
            count - todayCount
          } for future days`,
        );
      } else {
        console.log('✅ Prayer notifications already properly set up');
        const existing = await NotificationService.getScheduledNotifications();
        setScheduledCount(existing.length);
      }

      setAppState(prev => ({
        ...prev,
        isNotificationInitialized: true,
      }));
    } catch (error) {
      console.error('❌ Prayer notification initialization failed:', error);
      // Try fallback initialization
      try {
        console.log('🔄 Attempting fallback initialization...');
        const count = await PrayerTimeService.setupPerpetualChain();
        setScheduledCount(count);
        setAppState(prev => ({
          ...prev,
          isNotificationInitialized: true,
        }));
        console.log(
          `✅ Fallback initialization successful: ${count} notifications`,
        );
      } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
      }
    }
  };

  const initializeAuthenticatedServices = async () => {
    try {
      console.log('🔧 Initializing authenticated user services');
      // Initialize existing background tasks with delay to avoid conflicts
      setTimeout(() => {
        // 1. Initialize permissions first
        const permissionInitializer = PermissionInitializer.getInstance();
        permissionInitializer.initializeAppPermissions();
      }, 500);
    } catch (error) {
      console.error('❌ Failed to initialize authenticated services:', error);
    }
  };

  const setupAppStateListener = () => {
    // 🔄 SMART REFRESH - Enhanced logic for app state changes
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && appState.isNotificationInitialized) {
        try {
          console.log('📱 App became active, checking prayer notifications...');
          // Smart check - only refresh if notifications are not properly set up
          const isProperlySetup =
            await PrayerTimeService.checkAndEnsureNotifications();

          if (!isProperlySetup) {
            console.log(
              '🔄 Auto-refreshing due to missing/insufficient notifications',
            );
            const count = await PrayerTimeService.setupPerpetualChain();
            setScheduledCount(count);
            console.log(`✅ Refreshed with ${count} notifications`);
          } else {
            // Just update the count for display
            const remaining =
              await NotificationService.getScheduledNotifications();
            setScheduledCount(remaining.length);
            console.log(
              `✅ Notifications properly set up: ${remaining.length} total`,
            );
          }
        } catch (error) {
          console.error('❌ Error during app state refresh:', error);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  };

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setAppState(prev => ({...prev, hasSeenOnboarding: true}));
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      setAppState(prev => ({...prev, hasSeenOnboarding: true}));
    }
  };

  const handleSplashFinish = () => {
    setAppState(prev => ({...prev, showingSplash: false}));
  };

  // Show loading states
  if (appState.showingSplash) {
    return <SplashScreen onAuthCheck={handleSplashFinish} />;
  }

  if (isLoading || !appState.isReady) {
    return <LoadingScreen />;
  }

  // Common screen options
  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    gestureEnabled: true,
  };

  const modalScreenOptions = {
    headerShown: false,
    presentation: 'card' as const,
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!appState.hasSeenOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            options={{gestureEnabled: false}}
            children={({navigation}) => (
              <OnboardingScreen
                navigation={navigation}
                onOnboardingComplete={handleOnboardingFinish}
              />
            )}
          />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen
              name="Feeds"
              component={FeedsScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen
              name="NotificationScreen"
              component={NotificationScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen
              name="EditProfileScreen"
              component={EditProfileScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen
              name="CallerSettings"
              component={CallerSettingScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen
              name="PickupSettings"
              component={PickupSettingsScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen
              name="DatabaseScreen"
              component={DatabaseScreen}
              options={modalScreenOptions}
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
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AuthProvider>
          <SafeAreaContent />
        </AuthProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

function SafeAreaContent() {
  const insets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[
      styles.container,
      {
        // Apply only bottom, left, and right safe area - NO TOP
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        // Explicitly set paddingTop to 0 to remove top safe area
        paddingTop: 0,
      }
    ]}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </View>
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