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
      case 'Zikr':
        return 'prayer-beads';
      case 'Salah':
        return 'salah';
      case 'Profile':
        return 'user';
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
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
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
                size={24}
                style={isFocused ? styles.activeIcon : styles.inactiveIcon}
              />
              <Text
                style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}>
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
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activeIcon: {
    opacity: 1,
    // We can't directly change the SVG fill color, but we can modify opacity
  },
  inactiveIcon: {
    opacity: 0.6,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  focusedTabLabel: {
    color: colors.text.blue,

  },
});

export default CustomTabBar;
