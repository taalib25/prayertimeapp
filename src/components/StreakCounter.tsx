import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useFajrChartData} from '../hooks/useContextualData';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface DayStatus {
  date: string;
  status: 'attended' | 'missed' | 'upcoming';
  dayName: string;
}

const StreakCounter: React.FC = () => {
  // Initialize today date
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Initialize current week start
  const getCurrentWeekStart = useCallback(() => {
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to make Monday the first day
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [today]);

  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart);

  const {getFajrDataForDates} = useFajrChartData();

  // Format date to string (YYYY-MM-DD)
  const formatDate = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);

  // Get the week dates (Monday to Sunday)
  const getWeekDates = useCallback((startDate: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Day name abbreviations
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Calculate current streak and weekly progress
  const [weeklyData, setWeeklyData] = useState<DayStatus[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Calculate the streak and week data
  const calculateStreakData = useCallback(async () => {
    try {
      // Get last 30 days to calculate streak
      const pastDates: Date[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        pastDates.push(date);
      }

      const pastDateStrings = pastDates.map(formatDate);
      const fajrData = getFajrDataForDates(pastDateStrings);

      // Calculate streak
      let streak = 0;
      for (let i = fajrData.length - 1; i >= 0; i--) {
        if (fajrData[i].fajrStatus === 'mosque') {
          streak++;
        } else {
          break;
        }
      }

      setCurrentStreak(streak);

      // Get current week data
      const weekDates = getWeekDates(currentWeekStart);
      const weekDateStrings = weekDates.map(formatDate);
      const weekFajrData = getFajrDataForDates(weekDateStrings);

      // Map to weekly data format
      const weekData: DayStatus[] = weekDates.map((date, index) => {
        const dateStr = formatDate(date);
        const fajrInfo = weekFajrData.find(d => d.date === dateStr);

        const todayStr = formatDate(today);
        const isPast = date < today;
        const isToday = dateStr === todayStr;

        let status: 'attended' | 'missed' | 'upcoming' = 'upcoming';

        if (isPast || isToday) {
          status = fajrInfo?.fajrStatus === 'mosque' ? 'attended' : 'missed';
        }

        return {
          date: dateStr,
          status,
          dayName: dayNames[index],
        };
      });

      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  }, [currentWeekStart, formatDate, getWeekDates, getFajrDataForDates, today]);

  useEffect(() => {
    calculateStreakData();
  }, [calculateStreakData]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  // Navigate to next week - only if not past current week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);

    // Check if the new week start would be after today
    const todayWeekStart = getCurrentWeekStart();
    if (newDate <= todayWeekStart) {
      setCurrentWeekStart(newDate);
    }
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getCurrentWeekStart());
  };

  // Check if current week is shown
  const isCurrentWeek = useMemo(() => {
    const todayWeekStart = getCurrentWeekStart();
    return formatDate(currentWeekStart) === formatDate(todayWeekStart);
  }, [currentWeekStart, formatDate, getCurrentWeekStart]);

  // Can go to next week
  const canGoToNextWeek = useMemo(() => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    const todayWeekStart = getCurrentWeekStart();
    return newDate <= todayWeekStart;
  }, [currentWeekStart, getCurrentWeekStart]);

  // Week date range text
  const weekRangeText = useMemo(() => {
    if (isCurrentWeek) {
      return 'This Week';
    }

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const startMonth = currentWeekStart.toLocaleDateString('en', {
      month: 'short',
    });
    const endMonth = weekEnd.toLocaleDateString('en', {month: 'short'});
    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }, [currentWeekStart, isCurrentWeek]);

  return (
    <View style={styles.container}>
      {/* Streak Counter */}
      <View style={styles.streakContainer}>
        <View style={styles.streakCounterContainer}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <View style={styles.streakIconContainer}>
            <SvgIcon name="fire" size={98} color={colors.accent} />
          </View>
        </View>
        <Text style={styles.streakText}>Fajr Streak!</Text>
      </View>

      {/* Weekly Progress with integrated navigation */}
      <View style={styles.weeklyProgressContainer}>
        <TouchableOpacity
          onPress={goToCurrentWeek}
          style={styles.weeklyHeaderContainer}>
          <Text style={styles.weeklyTitle}>{weekRangeText}</Text>
        </TouchableOpacity>

        <View style={styles.weeklyNavigationContainer}>
          <TouchableOpacity
            style={styles.navButtonLeft}
            onPress={goToPreviousWeek}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.daysContainer}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text
                  style={[
                    styles.dayLabel,
                    day.status === 'attended' && styles.dayLabelActive,
                  ]}>
                  {day.dayName}
                </Text>
                <View
                  style={[
                    styles.dayIndicator,
                    day.status === 'attended' && styles.dayAttended,
                    day.status === 'upcoming' && styles.dayUpcoming,
                  ]}>
                  {day.status === 'attended' && (
                    <SvgIcon name="attended" size={16} color="#fff" />
                  )}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.navButtonRight,
              !canGoToNextWeek && styles.navButtonDisabled,
            ]}
            onPress={goToNextWeek}
            disabled={!canGoToNextWeek}>
            <Text
              style={[
                styles.navButtonText,
                !canGoToNextWeek && styles.navButtonTextDisabled,
              ]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  streakContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
  },
  streakCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  streakNumber: {
    ...typography.h1,
    fontSize: 72, // Increased for better visibility
    lineHeight: 84, // Prevent text cutoff
    color: colors.primary,
    fontWeight: 'bold',
  },
  streakIconContainer: {
    marginTop: 0, // Fixed alignment issue
    alignItems: 'flex-end',
  },
  streakText: {
    ...typography.bodyMedium,
    fontSize: 18,
    color: colors.text.dark,
    fontWeight: '600',
    marginLeft: 4,
    marginTop: 8, // Added spacing to prevent text cut-off
    lineHeight: 24, // Added to ensure proper text height
  },
  weeklyProgressContainer: {
    marginBottom: 4,
  },
  weeklyHeaderContainer: {
    marginBottom: 16,
    alignItems: 'flex-start', // Left-align the week range text
  },
  weeklyTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.text.dark,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 24, // Added to prevent text cut-off
  },
  weeklyNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayLabel: {
    ...typography.bodySmall,
    fontSize: 14,
    color: colors.text.dark,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18, // Ensure proper line height
  },
  dayLabelActive: {
    color: colors.success,
    fontWeight: '700',
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  dayAttended: {
    backgroundColor: colors.success,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dayUpcoming: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.text.muted,
    borderStyle: 'dashed',
  },
  navButtonLeft: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  navButtonRight: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.h2,
    fontSize: 28,
    color: colors.primary,
    marginTop: -4,
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: colors.text.muted,
  },
});

export default StreakCounter;
