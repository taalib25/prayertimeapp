import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {useFajrChartData} from '../hooks/useContextualData';

const screenWidth = Dimensions.get('window').width;

interface FajrCompletionData {
  date: string;
  fajrStatus: string;
  completionValue: number; // 0 = not at mosque, 1 = at mosque
  dayLabel: string;
}

const FajrTimeChart: React.FC = () => {
  const [currentCenterDate, setCurrentCenterDate] = useState(new Date());
  const [fajrData, setFajrData] = useState<FajrCompletionData[]>([]);

  // Use centralized context instead of direct database access
  const {getFajrDataForDates} = useFajrChartData();
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to convert prayer status to completion value (mosque only)
  const statusToValue = (status: string): number => {
    return status === 'mosque' ? 1 : 0;
  };

  // Helper function to get day label
  const getDayLabel = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en', options);
  };

  // Get 5-day range (3 before, current, 2 after)
  const getDatesRange = useCallback((centerDate: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = -3; i <= 2; i++) {
      const date = new Date(centerDate);
      date.setDate(centerDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Fetch Fajr completion data using centralized context
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
  }, [currentCenterDate, getFajrDataForDates, getDatesRange]);
  useEffect(() => {
    fetchFajrCompletionData();
  }, [fetchFajrCompletionData]);

  // Navigation handlers
  const goToPrevious = () => {
    const newDate = new Date(currentCenterDate);
    newDate.setDate(currentCenterDate.getDate() - 5);
    setCurrentCenterDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentCenterDate);
    newDate.setDate(currentCenterDate.getDate() + 5);
    setCurrentCenterDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentCenterDate(today);
  };

  // Check if current view includes today
  const isCurrentWeekIncludesToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = getDatesRange(currentCenterDate);
    return dates.some(date => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === today.getTime();
    });
  }; // Prepare chart data with error handling
  const getChartData = () => {
    if (fajrData.length === 0) {
      return {
        labels: ['Loading...'],
        datasets: [
          {
            data: [0], // No mosque attendance as default
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    } // Get completion values (0-1 scale for mosque only)
    const validData = fajrData.map(item => item.completionValue);

    // Debug: Log chart data being rendered
    console.log('📈 Chart data being rendered:', {
      labels: fajrData.map(item => item.dayLabel),
      data: validData,
      rawFajrData: fajrData.map(item => ({
        date: item.date,
        status: item.fajrStatus,
        value: item.completionValue,
      })),
    });

    return {
      labels: fajrData.map(item => item.dayLabel),
      datasets: [
        {
          data: validData,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for mosque attendance
          strokeWidth: 3,
        },
      ],
      // Y-axis will show 0 (Not at Mosque), 1 (Mosque)
      minValue: 0,
      maxValue: 1,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenge 40</Text>
        <View style={styles.navigationContainer}>
          <Pressable style={styles.navButton} onPress={goToPrevious}>
            <Text style={styles.navButtonText}>‹</Text>
          </Pressable>
          {!isCurrentWeekIncludesToday() && (
            <Pressable style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
          )}
          <Pressable style={styles.navButton} onPress={goToNext}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <LineChart
          data={getChartData()}
          width={screenWidth - 32}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.primary,
            },
            formatYLabel: (yLabel: string) => {
              const value = parseInt(yLabel);
              return value === 1 ? 'Mosque' : 'Not at Mosque';
            },
          }}
          bezier
          style={styles.chart}
          fromZero
          segments={1}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h3,
    fontSize: 25,
    color: colors.text.prayerBlue,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: -12, // Adjust vertical alignment
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mosqueIndicator: {
    backgroundColor: colors.success,
  },
  notMosqueIndicator: {
    backgroundColor: colors.text.muted,
  },
  dataTime: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 9,
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  todayTime: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default FajrTimeChart;
