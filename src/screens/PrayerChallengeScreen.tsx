import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import {
  getPrayerTrackingForDate,
  updatePrayerTracking,
  getPrayerTrackingRange,
  getPrayerStreak,
  DayPrayerStatus,
} from '../services/db/prayer_tracking_services';
import {getPrayerTimes} from '../services/db';
import PrayerChecklistItem from '../components/PrayerChecklistItem';
import CalendarDay from '../components/CalendarDay';
import CustomButton from '../components/CustomButton';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_DISPLAY_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const formatTo12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h || 12;
  return `${h}:${minutes} ${ampm}`;
};

const PrayerChallengeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [dayStatus, setDayStatus] = useState<DayPrayerStatus | null>(null);
  const [calendarData, setCalendarData] = useState<
    Record<string, DayPrayerStatus>
  >({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDate, currentMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load day status for selected date
      const status = await getPrayerTrackingForDate(selectedDate);
      setDayStatus(status);

      // Load prayer times for selected date
      const times = await getPrayerTimes(selectedDate);
      setPrayerTimes(times);

      // Load calendar data for current month
      const firstDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const lastDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const monthData = await getPrayerTrackingRange(startDate, endDate);
      setCalendarData(monthData);

      // Load current streak
      const currentStreak = await getPrayerStreak();
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading prayer challenge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrayerToggle = async (prayerName: string) => {
    if (!dayStatus) return;

    const currentStatus =
      dayStatus.prayers[prayerName as keyof typeof dayStatus.prayers];
    const newStatus = !currentStatus;

    try {
      await updatePrayerTracking(
        selectedDate,
        prayerName,
        newStatus,
        newStatus ? 'home' : undefined,
      );

      // Update local state
      const updatedStatus = {
        ...dayStatus,
        prayers: {
          ...dayStatus.prayers,
          [prayerName]: newStatus,
        },
      };
      updatedStatus.completedCount = Object.values(
        updatedStatus.prayers,
      ).filter(Boolean).length;

      setDayStatus(updatedStatus);

      // Update calendar data
      setCalendarData(prev => ({
        ...prev,
        [selectedDate]: updatedStatus,
      }));

      // Reload streak
      const newStreak = await getPrayerStreak();
      setStreak(newStreak);
    } catch (error) {
      Alert.alert('Error', 'Failed to update prayer status');
    }
  };

  const handlePrayerLongPress = (prayerName: string) => {
    Alert.alert('Prayer Options', `How did you perform ${prayerName}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'At Home',
        onPress: () =>
          updatePrayerTracking(selectedDate, prayerName, true, 'home').then(
            loadData,
          ),
      },
      {
        text: 'In Jamaath',
        onPress: () =>
          updatePrayerTracking(selectedDate, prayerName, true, 'jamaath').then(
            loadData,
          ),
      },
      {
        text: 'Late',
        onPress: () =>
          updatePrayerTracking(selectedDate, prayerName, true, 'late').then(
            loadData,
          ),
      },
    ]);
  };

  const renderCalendarWeek = (weekDates: Date[]) => {
    return (
      <View style={styles.calendarWeek}>
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === getCurrentDateString();

          return (
            <CalendarDay
              key={index}
              date={date}
              dayStatus={calendarData[dateStr]}
              isSelected={isSelected}
              isToday={isToday}
              onPress={() => setSelectedDate(dateStr)}
            />
          );
        })}
      </View>
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const weeks = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);

      if (currentDate > lastDay && currentDate.getDay() === 0) break;
    }

    return (
      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <CustomButton
            title="‹"
            onPress={() => setCurrentMonth(new Date(year, month - 1))}
            style={styles.navButton}
          />
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <CustomButton
            title="›"
            onPress={() => setCurrentMonth(new Date(year, month + 1))}
            style={styles.navButton}
          />
        </View>

        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        {weeks.map((week, index) => renderCalendarWeek(week))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {dayStatus?.completedCount || 0}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {dayStatus
                ? Math.round(
                    (dayStatus.completedCount / dayStatus.totalCount) * 100,
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Calendar */}
        {renderCalendar()}

        {/* Selected Date Info */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {dayStatus && (
            <Text style={styles.progressText}>
              {dayStatus.completedCount} of {dayStatus.totalCount} prayers
              completed
            </Text>
          )}
        </View>

        {/* Prayer Checklist */}
        <View style={styles.checklistContainer}>
          {PRAYER_NAMES.map((prayerName, index) => {
            const isCompleted =
              dayStatus?.prayers[
                prayerName as keyof typeof dayStatus.prayers
              ] || false;
            const time = prayerTimes
              ? formatTo12Hour(prayerTimes[prayerName])
              : undefined;

            return (
              <PrayerChecklistItem
                key={prayerName}
                prayerName={PRAYER_DISPLAY_NAMES[index]}
                isCompleted={isCompleted}
                onToggle={() => handlePrayerToggle(prayerName)}
                onLongPress={() => handlePrayerLongPress(prayerName)}
                time={time}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingText: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
  calendar: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    padding: 0,
    margin: 0,
  },
  monthTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    ...typography.caption,
    color: colors.text.muted,
    width: 40,
    textAlign: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  selectedDateContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedDateText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
  checklistContainer: {
    marginBottom: 20,
  },
});

export default PrayerChallengeScreen;
