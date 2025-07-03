import React from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon, {IconName} from '../components/SvgIcon';

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  // Map route names to icon names
  const getIconName = (routeName: string): IconName => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Feeds':
        return 'quran';
      case 'Progress':
        return 'salah'; // Using mosque icon for progress tracking
      case 'Profile':
        return 'profile';
      default:
        return 'home';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            try {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } catch (error) {
              console.error('Tab navigation error:', error);
            }
          };

          const iconName = getIconName(route.name);

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              onPress={onPress}
              style={styles.tabButton}>
              <SvgIcon
                name={iconName}
                size={29}
                color={isFocused ? colors.primary : colors.text.lightPrayerBlue}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.focusedTabLabel : styles.unfocusedTabLabel,
                ]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    // height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingTop: spacing.sm,
  },
  tabLabel: {
    ...typography.body,
    fontSize: 12,
    marginTop: 1,
  },
  focusedTabLabel: {
    color: colors.primary,
    ...typography.bodyMedium,
    fontSize: 14,
  },
  unfocusedTabLabel: {
    color: colors.text.lightPrayerBlue,
  },
});

export default CustomTabBar;
