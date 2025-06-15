import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Polygon} from 'react-native-svg';
import SvgIcon, {IconName} from './SvgIcon';

interface BadgeCardProps {
  icon: IconName;
  title: string;
  isEarned?: boolean;
  size?: number;
}

interface HexagonSVGProps {
  size: number;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
}

const HexagonSVG: React.FC<HexagonSVGProps> = ({
  size,
  fillColor,
  strokeColor,
  strokeWidth = 0,
}) => {
  // Calculate hexagon points for a regular hexagon
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  const pointsString = points.join(' ');

  return (
    <Svg width={size} height={size}>
      <Polygon
        points={pointsString}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

const BadgeCard: React.FC<BadgeCardProps> = ({
  icon,
  title,
  isEarned = false,
  size = 80,
}) => {
  const hexagonColor = isEarned ? '#4CAF50' : '#F5F5F5';
  const borderColor = isEarned ? '#4CAF50' : '#E0E0E0';
  const iconSize = Math.round(size * 0.4);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.hexagonContainer,
          {width: size, height: size},
          isEarned ? styles.earnedHexagon : styles.unearnedHexagon,
        ]}>
        {/* SVG Hexagon Background */}
        <HexagonSVG
          size={size}
          fillColor={hexagonColor}
          strokeColor={!isEarned ? borderColor : undefined}
          strokeWidth={!isEarned ? 2 : 0}
        />
        {/* Icon positioned absolutely over the hexagon */}
        <View style={styles.iconContainer}>
          <SvgIcon
            name={icon}
            size={iconSize}
            color={isEarned ? '#FFFFFF' : '#D0D0D0'}
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
