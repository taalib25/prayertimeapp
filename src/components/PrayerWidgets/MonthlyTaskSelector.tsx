import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../../utils/theme';
import {typography} from '../../utils/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MonthData {
  monthLabel: string;
  year: number;
  zikr: {current: number; total: number};
  quran: {current: number; total: number};
  fajr: {current: number; total: number};
  isha: {current: number; total: number};
}

// Generate data for the past 3 months
const getMonthlyData = (): MonthData[] => {
  const today = new Date();
  const months = [];

  for (let i = 2; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', {month: 'long'});
    const year = date.getFullYear();
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();

    months.push({
      monthLabel: monthName,
      year: year,
      zikr: {
        current: Math.floor(Math.random() * 2500) + 1500,
        total: 3000,
      },
      quran: {
        current: Math.floor(Math.random() * 200) + 150,
        total: 300,
      },
      fajr: {
        current:
          Math.floor(Math.random() * daysInMonth) +
          Math.floor(daysInMonth * 0.6),
        total: daysInMonth,
      },
      isha: {
        current:
          Math.floor(Math.random() * daysInMonth) +
          Math.floor(daysInMonth * 0.7),
        total: daysInMonth,
      },
    });
  }

  return months;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CompactChallengeCard: React.FC<{
  title: string;
  subtitle: string;
  current: number;
  total: number;
  backgroundColor: string;
  progressColor: string;
  textColor: string;
  isVisible: boolean;
}> = ({
  title,
  subtitle,
  current,
  total,
  backgroundColor,
  progressColor,
  textColor,
  isVisible,
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (isVisible) {
      progress.value = withTiming((current / total) * 100, {
        duration: 1200,
      });
    } else {
      progress.value = 0;
    }
  }, [current, total, isVisible]);

  const animatedProps = useAnimatedProps(() => {
    const percentage = progress.value;
    const strokeWidth = 8;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.compactCard, {backgroundColor}]}>
      <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>
      <Text style={[styles.compactSubtitle, {color: textColor}]}>
        {subtitle}
      </Text>

      <View style={styles.compactProgressContainer}>
        <Svg height="90" width="90" viewBox="0 0 80 80">
          <Circle
            cx="40"
            cy="40"
            r="35"
            stroke={colors.background.surface}
            strokeWidth="8"
            fill="transparent"
          />
          <AnimatedCircle
            cx="40"
            cy="40"
            r="35"
            stroke={progressColor}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 35}`}
            strokeLinecap="round"
            fill="transparent"
            transform="rotate(-90, 40, 40)"
            animatedProps={animatedProps}
          />
        </Svg>

        <View style={styles.compactProgressText}>
          <Text style={[styles.compactProgressValue, {color: textColor}]}>
            {current}
            <Text style={[styles.compactProgressTotal, {color: textColor}]}>
              /{total}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const MonthlyChallengeSelector: React.FC = () => {
  const monthlyData = getMonthlyData();
  const [currentPage, setCurrentPage] = useState(monthlyData.length - 1);
  const pagerRef = useRef<PagerView>(null);

  React.useEffect(() => {
    // Start animation immediately for the current month
  }, []);

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setCurrentPage(position);
  };

  const MonthView: React.FC<{monthData: MonthData; index: number}> = ({
    monthData,
    index,
  }) => {
    const isVisible = currentPage === index;

    return (
      <View style={styles.monthContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.monthTitle}>
            {monthData.monthLabel} {monthData.year}
          </Text>
        </View>

        <View style={styles.compactCardsGrid}>
          <CompactChallengeCard
            title="Zikr"
            subtitle="Monthly"
            current={monthData.zikr.current}
            total={monthData.zikr.total}
            backgroundColor="#E8F5E8"
            progressColor={colors.emerald}
            textColor={colors.forest}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            title="Quran"
            subtitle="Pages"
            current={monthData.quran.current}
            total={monthData.quran.total}
            backgroundColor="#E3F2FD"
            progressColor={colors.accent}
            textColor={colors.primary}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            title="Fajr"
            subtitle="Days"
            current={monthData.fajr.current}
            total={monthData.fajr.total}
            backgroundColor="#FFF3E0"
            progressColor={colors.success}
            textColor={colors.forest}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            title="Isha"
            subtitle="Days"
            current={monthData.isha.current}
            total={monthData.isha.total}
            backgroundColor="#FCE4EC"
            progressColor={colors.error}
            textColor={colors.primary}
            isVisible={isVisible}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={monthlyData.length - 1}
        onPageSelected={handlePageSelected}
        pageMargin={8}>
        {monthlyData.map((monthData, index) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView monthData={monthData} index={index} />
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicator */}
      <View style={styles.paginationContainer}>
        {monthlyData.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => pagerRef.current?.setPage(index)}>
            <View
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const styles = StyleSheet.create({
  container: {
    height: 400,
    backgroundColor: colors.background.light,
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  monthContainer: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  titleContainer: {
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  monthTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'left',
  },
  compactCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  compactCard: {
    width: '48%',
    aspectRatio: 1.0,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactTitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: 2,
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
  },
  compactProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProgressValue: {
    ...typography.h3,
    textAlign: 'center',
  },
  compactProgressTotal: {
    ...typography.body,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted || '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default MonthlyChallengeSelector;
