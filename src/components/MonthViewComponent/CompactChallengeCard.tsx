import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {colors} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface CompactChallengeCardProps {
  id: string;
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  backgroundColor: string;
  progressColor: string;
  textColor: string;
  isVisible: boolean;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const CompactChallengeCard: React.FC<CompactChallengeCardProps> =
  React.memo(
    ({
      id,
      title,
      subtitle,
      current,
      total,
      backgroundColor,
      progressColor,
      textColor,
      isVisible,
    }) => {
      const exceededGoal = current > total;
      const actualProgressColor = exceededGoal ? colors.success : progressColor;

      // Calculate progress percentage
      const progressPercentage = useMemo(() => {
        const percentage = exceededGoal
          ? 100
          : Math.min((current / total) * 100, 100);
        return Math.round(percentage);
      }, [current, total, exceededGoal]);

      return (
        <View style={[styles.compactCard, {backgroundColor}]}>
          <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>
          <View style={styles.compactProgressContainer}>
            <AnimatedCircularProgress
              size={140}
              width={12} // Increased stroke thickness
              fill={progressPercentage}
              tintColor={actualProgressColor}
              backgroundColor={colors.background.surface}
              rotation={0}
              lineCap="round"
              duration={0} // No animation - instant update
            >
              {() => (
                <View style={styles.compactProgressText}>
                  <Text
                    style={[
                      styles.compactProgressValue,
                      {color: exceededGoal ? colors.success : textColor},
                    ]}>
                    {current}
                    <Text
                      style={[
                        styles.compactProgressTotal,
                        {color: exceededGoal ? colors.success : textColor},
                      ]}>
                      /{total}
                    </Text>
                  </Text>
                </View>
              )}
            </AnimatedCircularProgress>
            {/* Show exceeded indicator */}
            {/* {exceededGoal && (
            <View style={styles.exceededIndicator}>
              <Text style={styles.exceededText}>Goal Exceeded! 🎉</Text>
            </View>
          )} */}
          </View>
          {subtitle && (
            <Text style={[styles.compactSubtitle, {color: textColor}]}>
              {subtitle}
            </Text>
          )}
        </View>
      );
    },
    // Simplified comparison - only re-render when essential values change
    (prevProps, nextProps) => {
      return (
        prevProps.current === nextProps.current &&
        prevProps.total === nextProps.total &&
        prevProps.isVisible === nextProps.isVisible
      );
    },
  );

const styles = StyleSheet.create({
  compactCard: {
    width: '48%',
    aspectRatio: 1.0,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    // alignItems: 'flex-start',
    // justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactTitle: {
    ...typography.h3,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 6,
  },
  compactSubtitle: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  compactProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  compactProgressText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProgressValue: {
    ...typography.h3,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 36,
  },
  compactProgressTotal: {
    ...typography.bodySmall,
    fontSize: 16,
  },
  exceededIndicator: {
    position: 'absolute',
    bottom: -25,
    alignItems: 'center',
  },
  exceededText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  todayContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  todayText: {
    ...typography.caption,
    color: colors.text.prayerBlue,
    fontWeight: '600',
  },
  editHint: {
    ...typography.caption,
    color: colors.text.prayerBlue,
    opacity: 0.7,
    fontSize: 10,
  },
});

export default CompactChallengeCard;
