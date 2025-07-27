import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, Pressable, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {LineChart} from 'react-native-chart-kit';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {formatDateString} from '../utils/helpers';
import withObservables from '@nozbe/with-observables';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';

const screenWidth = Dimensions.get('window').width;

interface FajrCompletionData {
  date: string;
  fajrStatus: string;
  completionValue: number; // 0 = not at mosque, 1 = at mosque
  dayLabel: string;
}

interface FajrTimeChartProps {
  dailyTasks: DailyTasksModel[];
}

const FajrTimeChart: React.FC<FajrTimeChartProps> = ({dailyTasks}) => {
  const [currentCenterDate, setCurrentCenterDate] = useState(new Date());
  const [fajrData, setFajrData] = useState<FajrCompletionData[]>([]);

  // Reanimated shared value for chart opacity
  const chartOpacity = useSharedValue(1);

  // Replace useFajrChartData with direct dailyTasks processing
  const getFajrDataForDates = useCallback(
    (dates: string[]) => {
      return dates.map(date => {
        const dayData = dailyTasks.find(task => task.date === date);
        const fajrStatus = dayData?.fajrStatus || 'none'; // Default to 'none' if no data
        return {
          date,
          fajrStatus,
          completionValue: fajrStatus === 'mosque' ? 1 : 0,
          dayLabel: formatDayLabel(date),
        };
      });
    },
    [dailyTasks],
  );

  // Helper function for day labels
  const formatDayLabel = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Tomorrow';
    }
    if (diffDays === -1) {
      return 'Yesterday';
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en', options);
  }, []); // Helper functions - memoized for performance
  const formatDate = useCallback((date: Date): string => {
    return formatDateString(date);
  }, []);

  const statusToValue = useCallback((status: string): number => {
    return status === 'mosque' ? 1 : 0;
  }, []);

  const getDayLabel = useCallback((date: Date): string => {
    return date.getDate().toString();
  }, []);
  // Get 10-day range (5 before, current, 4 after)
  const getDatesRange = useCallback((centerDate: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = -5; i <= 4; i++) {
      const date = new Date(centerDate);
      date.setDate(centerDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []); // Memoized month text for performance
  const monthText = useMemo(() => {
    const dates = getDatesRange(currentCenterDate);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return startDate.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric',
      });
    } else if (startYear === endYear) {
      const startMonthName = startDate.toLocaleDateString('en', {
        month: 'long',
      });
      const endMonthName = endDate.toLocaleDateString('en', {month: 'long'});
      return `${startMonthName} - ${endMonthName} ${startYear}`;
    } else {
      const startMonthYear = startDate.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric',
      });
      const endMonthYear = endDate.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric',
      });
      return `${startMonthYear} - ${endMonthYear}`;
    }
  }, [currentCenterDate, getDatesRange]);

  // Memoized days range for performance
  const daysRangeText = useMemo(() => {
    const dates = getDatesRange(currentCenterDate);
    const startDay = dates[0].getDate();
    const endDay = dates[dates.length - 1].getDate();
    return `${startDay} - ${endDay}`;
  }, [currentCenterDate, getDatesRange]);

  // Fetch Fajr completion data using centralized context - now reactive
  const fetchFajrCompletionData = useCallback(async () => {
    try {
      const dates = getDatesRange(currentCenterDate);
      const dateStrings = dates.map(formatDate);

      // Get data from centralized context
      const fajrContextData = getFajrDataForDates(dateStrings);

      const fajrCompletionData: FajrCompletionData[] = fajrContextData.map(
        (item, index) => ({
          date: item.date,
          fajrStatus: item.fajrStatus,
          completionValue: item.completionValue,
          dayLabel: getDayLabel(dates[index]),
        }),
      );

      setFajrData(fajrCompletionData);
    } catch (error) {
      console.error('Error fetching Fajr completion data:', error);
    }
  }, [currentCenterDate, getFajrDataForDates, getDatesRange, dailyTasks]); // Now reactive to actual data changes
  useEffect(() => {
    fetchFajrCompletionData();
  }, [fetchFajrCompletionData]); // Reanimated animation function for chart transitions
  const animateChartTransition = () => {
    chartOpacity.value = withSequence(
      withTiming(0.3, {duration: 150}),
      withTiming(1, {duration: 300}),
    );
  };

  // Animated style for chart container
  const animatedChartStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
  }));

  // Navigation handlers with animation
  const goToPrevious = useCallback(() => {
    animateChartTransition();
    const newDate = new Date(currentCenterDate);
    newDate.setDate(currentCenterDate.getDate() - 10);
    setCurrentCenterDate(newDate);
  }, [currentCenterDate]);

  const goToNext = useCallback(() => {
    animateChartTransition();
    const newDate = new Date(currentCenterDate);
    newDate.setDate(currentCenterDate.getDate() + 10);
    setCurrentCenterDate(newDate);
  }, [currentCenterDate]);

  const goToToday = useCallback(() => {
    animateChartTransition();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentCenterDate(today);
  }, []); // Memoized chart data for performance
  const chartData = useMemo(() => {
    if (fajrData.length === 0) {
      return {
        labels: Array.from({length: 10}, (_, i) => (i + 1).toString()),
        datasets: [
          {
            data: Array(10).fill(0),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }

    const validData = fajrData.map(item => item.completionValue);

    return {
      labels: fajrData.map(item => item.dayLabel),
      datasets: [
        {
          data: validData,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      minValue: 0,
      maxValue: 1,
    };
  }, [fajrData]);
  // Check if current view includes today for chart highlighting
  const todayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = getDatesRange(currentCenterDate);
    return dates.findIndex(date => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === today.getTime();
    });
  }, [currentCenterDate, getDatesRange]);
  return (
    <View style={styles.container}>
      {/* Header with title - left aligned */}
      <View style={styles.header}>
        <Text style={styles.title}>Challenge 40</Text>
      </View>
      {/* Chart */}
      <Animated.View style={[styles.chartContainer, animatedChartStyle]}>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: todayIndex >= 0 ? colors.accent : colors.primary,
              fill: todayIndex >= 0 ? colors.accent : colors.primary,
            },
            formatYLabel: (yLabel: string) => {
              const value = parseInt(yLabel);
              return value === 1 ? 'Mosque' : 'Attended';
            },
          }}
          bezier
          style={styles.chart}
          fromZero
          segments={1}
        />
      </Animated.View>
      {/* Navigation with month info in the middle */}
      <View style={styles.bottomNavigation}>
        <Pressable style={styles.navButton} onPress={goToPrevious}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>

        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>{monthText}</Text>
          <Text style={styles.dateRange}>Days: {daysRangeText}</Text>
        </View>

        <Pressable style={styles.navButton} onPress={goToNext}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    alignItems: 'flex-start', // Left aligned
    marginBottom: 16,
  },
  title: {
    ...typography.h3,
    fontSize: 25,
    color: colors.text.prayerBlue,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  monthContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primary, // Dark background for contrast
    borderRadius: 8,
    minWidth: 120,
    flex: 1,
    marginHorizontal: 8,
  },
  monthText: {
    ...typography.body,
    fontSize: 14,
    color: '#ffffff', // White text for dark background
  },
  dateRange: {
    ...typography.caption,
    fontSize: 11,
    color: '#ffffff', // White text for dark background
    opacity: 0.9,
    marginTop: 1,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -8,
  },
});

// ✅ REACTIVE: Enhance with WatermelonDB observables for automatic updates
const enhance = withObservables([], () => ({
  dailyTasks: database
    .get<DailyTasksModel>('daily_tasks')
    .query(Q.sortBy('date', Q.desc))
    .observeWithColumns([
      'date',
      'fajr_status',
      'dhuhr_status',
      'asr_status',
      'maghrib_status',
      'isha_status',
      'total_zikr_count',
      'quran_minutes',
      'special_tasks',
    ]),
}));

export default enhance(FajrTimeChart);
