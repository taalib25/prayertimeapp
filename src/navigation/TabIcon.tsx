import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon, {IconName} from '../components/SvgIcon';

interface TabIconProps {
  iconName: IconName;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({iconName, focused, label}) => {
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

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
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
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default TabIcon;
