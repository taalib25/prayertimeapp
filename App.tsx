/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {PropsWithChildren, useEffect} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import LoginScreen from './src/screens/LoginScreen';
import PrayerTimeScreen from './src/screens/PrayerTimeScreen';
import DatabaseTestScreen from './src/screens/DatabaseTestScreen'; // Import DatabaseTestScreen
import {DatabaseProvider} from './src/services/db/databaseProvider';

import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CallScreen from './src/screens/CallScreen';
import FakeCallScreen from './src/screens/FakeCallScreen'; // Import FakeCallScreen
import notifee, {EventType} from '@notifee/react-native';

// Define screen names and their params
export type RootStackParamList = {
  Login: undefined;
  MainApp: undefined;
  DatabaseTest: undefined;
  CallScreen: undefined;
  FakeCallScreen: undefined; // Add FakeCallScreen to the stack
};

type SectionProps = PropsWithChildren<{
  title: string;
}>;

// Placeholder for Top Navigation Bar (can be used as a header in stack navigator)
const TopNavBar = () => {
  const isDarkMode = useColorScheme() === 'dark';
  // Placeholder action for language change
  const handleChangeLanguage = () => {
    console.log('Change language pressed');
    // Here you would implement logic to change the language
    // e.g., update a context, state, or use a localization library
  };

  return (
    <View style={styles.topNavContainer}>
      <View style={styles.topNavTitleContainer}>
        {/* You can add a dynamic title here if needed */}
      </View>
      <TouchableOpacity
        onPress={handleChangeLanguage}
        style={styles.translateButton}>
        {/* Using "T" as a placeholder for a 2D grey icon */}
        <Text
          style={[
            styles.translateButtonText,
            {
              color: isDarkMode
                ? Colors.light
                : Colors.darkGray /* Adjusted for grey icon */,
            },
          ]}>
          T
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Global navigation ref
export const navigationRef =
  React.createRef<NavigationContainerRef<RootStackParamList>>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    async function bootstrapApp() {
      try {
        await notifee.requestPermission();
        const initialNotification = await notifee.getInitialNotification();
        if (
          initialNotification &&
          initialNotification.notification.data?.screen === 'FakeCallScreen'
        ) {
          console.log(
            'App opened by initial notification for FakeCallScreen:',
            initialNotification.notification,
          );
          // Queue navigation until the navigator is ready
          const interval = setInterval(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('FakeCallScreen');
              clearInterval(interval);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error during bootstrapApp: ', error);
      }
    }

    bootstrapApp();

    // Handle foreground notification events
    const unsubscribeForeground = notifee.onForegroundEvent(
      ({type, detail}) => {
        const {notification, pressAction} = detail;

        switch (type) {
          case EventType.PRESS:
            console.log('User pressed notification', notification);
            if (notification?.data?.screen === 'FakeCallScreen') {
              navigationRef.current?.navigate('FakeCallScreen');
            }
            break;

          case EventType.ACTION_PRESS:
            if (pressAction?.id === 'answer-call') {
              console.log('User accepted call from notification action');
              navigationRef.current?.navigate('FakeCallScreen');
            }
            break;
        }
      },
    );
    return () => {
      unsubscribeForeground();
    };
  }, []);

  return (
    <DatabaseProvider>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={backgroundStyle}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="MainApp"
              component={PrayerTimeScreen}
              options={{
                headerShown: true,
                header: () => <TopNavBar />,
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
              name="CallScreen"
              component={CallScreen}
              options={{
                headerShown: true,
                title: 'Schedule Prayer Call', // Changed title
              }}
            />
            <Stack.Screen
              name="FakeCallScreen"
              component={FakeCallScreen}
              options={{headerShown: false}} // No header for call screen
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
