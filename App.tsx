import React, {useState, useEffect} from 'react';
import {SafeAreaView, StatusBar, View, useColorScheme, StyleSheet, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
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
import {initializeUserBackgroundTasks} from './src/services/backgroundTasks';
import {colors} from './src/utils/theme';
import PrayerTimeService from './src/services/notifications/prayerTimeService';
import NotificationService from './src/services/notifications/notificationServices';

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
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as any, params);
}

export function goBack() {
  navigationRef.current?.goBack();
}

// Loading component
const LoadingScreen = () => <View style={styles.loadingContainer} />;

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
    setupAppStateListener();
  }, []);

  // Initialize background services when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && appState.isReady) {
      initializeAuthenticatedServices();
    }
  }, [isAuthenticated, isLoading, appState.isReady]);

  const initializeApp = async () => {
    try {
      // Check onboarding status
      const onboardingValue = await AsyncStorage.getItem('hasSeenOnboarding');
      const hasSeenOnboarding = onboardingValue === 'true';
      
      setAppState(prev => ({
        ...prev,
        hasSeenOnboarding,
      }));
      
      // Check auth state
      await checkAuthState();
      
      // 🚀 Initialize Prayer Notification Service
      await initializePrayerNotifications();
      
      setAppState(prev => ({
        ...prev,
        showingSplash: false,
        isReady: true,
      }));
    } catch (error) {
      console.error('App initialization error:', error);
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
      // 🚀 PRIMARY ENTRY POINT - Sets up the entire prayer notification chain
      const count = await PrayerTimeService.setupPerpetualChain();
      setScheduledCount(count);
      setAppState(prev => ({
        ...prev,
        isNotificationInitialized: true,
      }));
      console.log(`✅ Prayer notifications initialized with ${count} notifications`);
    } catch (error) {
      console.error('❌ Prayer notification initialization failed:', error);
    }
  };

  const initializeAuthenticatedServices = async () => {
    try {
      console.log('Initializing authenticated user services');
      // Initialize existing background tasks
      setTimeout(() => initializeUserBackgroundTasks(1001), 300);
    } catch (error) {
      console.error('Failed to initialize authenticated services:', error);
    }
  };

  const setupAppStateListener = () => {
    // 🔄 SMART REFRESH - Only when app comes back from background
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && appState.isNotificationInitialized) {
        try {
          // Check if notifications are running low (less than 5 remaining)
          const remaining = await NotificationService.getScheduledNotifications();
          if (remaining.length < 5) {
            console.log('🔄 Auto-refreshing due to low notification count');
            const newCount = await PrayerTimeService.handleRefresh();
            if (typeof newCount === 'number') {
              setScheduledCount(newCount);
            }
          }
        } catch (error) {
          console.error('Error during app state refresh:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup function
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
            <Stack.Screen name="Feeds" component={FeedsScreen} options={modalScreenOptions} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={modalScreenOptions} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={modalScreenOptions} />
            <Stack.Screen name="CallerSettings" component={CallerSettingScreen} options={modalScreenOptions} />
            <Stack.Screen name="PickupSettings" component={PickupSettingsScreen} options={modalScreenOptions} />
            <Stack.Screen name="DatabaseScreen" component={DatabaseScreen} options={modalScreenOptions} />
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
    <DatabaseProvider>
      <AuthProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
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
