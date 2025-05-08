/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import LoginScreen from './src/screens/LoginScreen'; // Import LoginScreen
import PrayerTimeScreen from './src/screens/PrayerTimeScreen';
import {DatabaseProvider} from './src/services/db/databaseProvider';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

// Define screen names
type ScreenName = 'Home' | 'Prayers' | 'Settings' | 'Login'; // Add 'Login'

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

// Placeholder for Top Navigation Bar
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

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Login'); // Start with Login screen
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add isLoggedIn state

  const backgroundStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('Prayers');
  };

  const renderScreenContent = () => {
    switch (currentScreen) {
      case 'Login': // Add case for Login
        return <LoginScreen onLogin={handleLogin} />;
      case 'Prayers':
        return <PrayerTimeScreen />;
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <DatabaseProvider>
        <SafeAreaView style={backgroundStyle}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          {renderScreenContent()}
        </SafeAreaView>
      </DatabaseProvider>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <TopNavBar />
      <View style={styles.contentContainer}>{renderScreenContent()}</View>
    </SafeAreaView>
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
