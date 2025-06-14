import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import SvgIcon, {IconName} from './SvgIcon';

interface BadgeCardProps {
  icon: IconName;
  title: string;
  isEarned?: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  icon,
  title,
  isEarned = false,
}) => {
  const hexagonColor = isEarned ? '#4CAF50' : '#F5F5F5';
  const borderColor = isEarned ? '#4CAF50' : '#E0E0E0';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.hexagonContainer,
          isEarned ? styles.earnedHexagon : styles.unearnedHexagon,
        ]}>
        {/* Hexagon shape created with multiple Views */}
        <View style={styles.hexagonInner}>
          <View
            style={[styles.hexagonTop, {borderBottomColor: hexagonColor}]}
          />
          <View
            style={[
              styles.hexagonMiddle,
              {backgroundColor: hexagonColor},
              !isEarned && {borderWidth: 2, borderColor: borderColor},
            ]}>
            <SvgIcon
              name={icon}
              size={24}
              color={isEarned ? '#FFFFFF' : '#D0D0D0'}
            />
          </View>
          <View
            style={[styles.hexagonBottom, {borderTopColor: hexagonColor}]}
          />
        </View>
      </View>
      <Text style={[styles.title, !isEarned && styles.unearnedText]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  hexagonContainer: {
    marginBottom: 12,
    width: 85,
    height: 85,
  },
  hexagonInner: {
    width: 85,
    height: 85,
    alignItems: 'center',
  },
  hexagonTop: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hexagonMiddle: {
    width: 50,
    height: 57,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -1,
  },
  hexagonBottom: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  earnedHexagon: {
    // Add shadow for earned badges
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  unearnedHexagon: {
    // Subtle shadow for unearned badges
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  unearnedText: {
    color: '#999',
    fontWeight: '400',
  },
});

export default BadgeCard;
