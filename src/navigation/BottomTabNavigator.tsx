import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet} from 'react-native';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon, {IconName} from '../components/SvgIcon';

// Import screens
import PrayerTimeScreen from '../screens/PrayerTimeScreen';
import ZikrScreen from '../screens/ZikrScreen';
import PrayerChallengeScreen from '../screens/PrayerChallengeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define tab param list
export type BottomTabParamList = {
  Home: undefined;
  Zikr: undefined;
  Salah: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom tab bar icon component
const TabIcon: React.FC<{
  iconName: IconName;
  focused: boolean;
  label: string;
}> = ({iconName, focused, label}) => {
  // Add error handling for SVG icon
  const iconColor = focused ? colors.accent : colors.text.secondary;

  return (
    <View style={styles.tabIconContainer}>
      <View style={styles.iconWrapper}>
        <SvgIcon name={iconName} size={24} color={iconColor} />
        {/* Fallback text icon in case SVG fails */}
        <Text style={[styles.fallbackIcon, {color: iconColor}]}>
          {label[0].toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.tabLabel, {color: iconColor}]}>{label}</Text>
    </View>
  );
};

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.secondary,
      }}>
      <Tab.Screen
        name="Home"
        component={PrayerTimeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Zikr"
        component={ZikrScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName="prayer-beads" focused={focused} label="Zikr" />
          ),
        }}
      />
      <Tab.Screen
        name="Salah"
        component={PrayerChallengeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName="masjid" focused={focused} label="Salah" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName="user" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.dark,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    height: 80,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  iconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BottomTabNavigator;
