import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../../utils/theme';
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
  backgroundColor = colors.background.surface,
  progressColor = colors.accent,
  textColor = colors.text.prayerBlue,
}) => {
  // Calculate percentage for the progress ring
  const percentage = (current / total) * 100;
  const strokeWidth = 8;
  const radius = 40; // Adjusted from 50 to 40 for better proportion
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
        <Svg height="140" width="140" viewBox="0 0 100 100">
          {' '}
          {/* Background Circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke={colors.background.surface}
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
            <Text style={styles.progressTotal}>/{total}</Text>
          </Text>
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
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  title: {
    ...typography.h3,
    letterSpacing: 0.5,
    lineHeight: 24,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.bodyMedium,
    marginTop: 4,
    opacity: 0.8,
    lineHeight: 18,
    textAlign: 'left',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  progressTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  progressValue: {
    ...typography.statNumber,
    lineHeight: 36,
  },
  progressTotal: {
    ...typography.bodyMedium,
    color: colors.primary,
    lineHeight: 24,
  },
});

export default Challenge40Card;
