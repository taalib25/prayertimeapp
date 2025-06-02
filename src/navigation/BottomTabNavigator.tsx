import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {colors} from '../utils/theme';

// Import screens
import PrayerTimeScreen from '../screens/PrayerTimeScreen';
import ZikrScreen from '../screens/ZikrScreen';
import PrayerChallengeScreen from '../screens/PrayerChallengeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomTabBar from './CustomTabBar';

// Define tab param list
export type BottomTabParamList = {
  Home: undefined;
  Zikr: undefined;
  Salah: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.secondary,
      }}>
      <Tab.Screen name="Home" component={PrayerTimeScreen} />
      <Tab.Screen name="Zikr" component={ZikrScreen} />
      <Tab.Screen name="Salah" component={PrayerChallengeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
