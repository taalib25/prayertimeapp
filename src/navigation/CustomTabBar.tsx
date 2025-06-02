import React from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import {colors, spacing} from '../utils/theme';
import TabIcon from './TabIcon'; // We'll extract the TabIcon to its own file

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView
          style={styles.absolute}
          blurType="light"
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.white}
        />
      ) : (
        <View style={[styles.absolute, styles.androidBlurFallback]} />
      )}

      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
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

          // Map route names to icon names
          const getIconName = (routeName: string): string => {
            switch (routeName) {
              case 'Home':
                return 'home';
              case 'Zikr':
                return 'prayer-beads';
              case 'Salah':
                return 'masjid';
              case 'Profile':
                return 'user';
              default:
                return 'home';
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              onPress={onPress}
              style={styles.tabButton}>
              <TabIcon
                iconName={getIconName(route.name) as any}
                focused={isFocused}
                label={route.name}
              />
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
    height: 80,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidBlurFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // For Android fallback
  },
  tabBar: {
    flexDirection: 'row',
    height: 80,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;
