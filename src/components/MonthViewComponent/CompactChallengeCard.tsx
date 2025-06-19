import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {colors} from '../../utils/theme';
import {fontFamilies, typography} from '../../utils/typography';

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
      const goalReachedOrExceeded = current >= total;
      const actualProgressColor = goalReachedOrExceeded
        ? colors.success
        : progressColor;
      const actualTextColor = goalReachedOrExceeded
        ? colors.success
        : textColor; // Calculate progress percentage
      const progressPercentage = useMemo(() => {
        const percentage = goalReachedOrExceeded
          ? 100
          : Math.min((current / total) * 100, 100);
        return Math.round(percentage);
      }, [current, total, goalReachedOrExceeded]);

      return (
        <View style={[styles.compactCard, {backgroundColor}]}>
          <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>
          <View style={styles.compactProgressContainer}>
            <AnimatedCircularProgress
              size={170} // Increased from 140 to 160
              width={15} // Increased stroke
              fill={progressPercentage}
              tintColor={actualProgressColor}
              backgroundColor={colors.background.surface}
              rotation={0}
              lineCap="round"
              duration={5} // No animation - instant update
            >
              {() => (
                <View style={styles.compactProgressText}>
                  <Text
                    style={[
                      styles.compactProgressValue,
                      {color: actualTextColor},
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}>
                    {current}
                    <Text
                      style={[
                        styles.compactProgressTotal,
                        {color: actualTextColor},
                      ]}>
                      /{total}
                    </Text>
                  </Text>
                </View>
              )}
            </AnimatedCircularProgress>
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
    // Remove fixed width/height that might be constraining
    flex: 1, // Allow container to expand
    paddingHorizontal: 12, // Add more padding
    paddingVertical: 8,
  },
  compactProgressValue: {
    textAlign: 'center',
    ...typography.h3,

    fontSize: 38, // Reduced from 32 to ensure it fits
    lineHeight: 32, // Adjusted line height
    color: 'inherit', // Use inherited color
  },
  compactProgressTotal: {
    fontFamily: fontFamilies.regular,
    fontSize: 14, // Smaller for the total (/total)
    fontWeight: '500',
    opacity: 0.8, // Slightly faded to emphasize hierarchy
    color: 'inherit', // Use inherited color
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
  },
  todayContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  todayText: {
    ...typography.caption,
    color: colors.text.prayerBlue,
  },
  editHint: {
    ...typography.caption,
    color: colors.text.prayerBlue,
    opacity: 0.7,
    fontSize: 10,
  },
});

export default CompactChallengeCard;
