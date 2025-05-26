import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {typography} from '../../utils/typography';

interface Challenge40CardProps {
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  backgroundColor?: string;
  progressColor?: string;
  textColor?: string;
}

const Challenge40Card: React.FC<Challenge40CardProps> = ({
  title,
  subtitle = 'Fajr',
  current,
  total,
  backgroundColor = '#e4fbff',
  progressColor = '#00C2CB',
  textColor = '#3C4A9B',
}) => {
  // Calculate percentage for the progress ring
  const percentage = (current / total) * 100;
  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: textColor}]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, {color: textColor}]}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Svg height="100" width="100" viewBox="0 0 100 100">
          {/* Background Circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E0F7F8"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform="rotate(-90, 50, 50)"
          />
        </Svg>

        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressValue, {color: textColor}]}>
            {current}
          </Text>
          <Text style={styles.progressTotal}>/{total}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  subtitle: {
    ...typography.bodyTiny,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressValue: {
    ...typography.statNumber,
    fontSize: 28,
  },
  progressTotal: {
    ...typography.body,
    color: '#999',
    fontSize: 16,
  },
});

export default Challenge40Card;
