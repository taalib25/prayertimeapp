import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel, {PrayerStatus} from '../model/DailyTasks';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import AttendanceSelectionModal, {
  AttendanceType,
} from './AttendanceSelectionModal';
import {getTodayDateString, formatDateString} from '../utils/helpers';
import {updatePrayerStatus} from '../services/db/dailyTaskServices';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
  selectedDate?: string; // Add optional selectedDate prop
  dailyTasks: DailyTasksModel[]; // Added for withObservables
}

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({
  prayers,
  selectedDate,
  dailyTasks, // Now comes from withObservables
}) => {
  const [attendancePopupVisible, setAttendancePopupVisible] = useState(false);
  const [selectedPrayerForAttendance, setSelectedPrayerForAttendance] =
    useState<PrayerTime | null>(null);

  // ✅ REACTIVE: Debug effect to track dailyTasks changes
  useEffect(() => {
    console.log(
      `🔄 PrayerTimeCards: dailyTasks updated, count: ${dailyTasks.length}`,
    );
    console.log(
      `📅 Available dates: ${dailyTasks.map(t => t.date).join(', ')}`,
    );
  }, [dailyTasks]);

  // Use reactive dailyTasks prop instead of hook

  const isToday = useMemo(() => {
    const today = getTodayDateString();
    return selectedDate === today;
  }, [selectedDate]);

  // Get prayer status for a specific prayer with enhanced debugging
  const getPrayerStatus = useCallback(
    (prayerName: string): PrayerStatus => {
      const dateToCheck = selectedDate || getTodayDateString();

      // Find task for the date from reactive dailyTasks prop
      const task = dailyTasks.find(t => t.date === dateToCheck);

      console.log(
        `🔍 getPrayerStatus: ${prayerName} for ${dateToCheck}, found task:`,
        task ? `ID: ${task.id}, date: ${task.date}` : 'none',
      );

      if (!task) return null;

      const lcPrayerName = prayerName.toLowerCase();
      let status: PrayerStatus = null;

      switch (lcPrayerName) {
        case 'fajr':
          status = (task.fajrStatus as PrayerStatus) || null;
          break;
        case 'dhuhr':
          status = (task.dhuhrStatus as PrayerStatus) || null;
          break;
        case 'asr':
          status = (task.asrStatus as PrayerStatus) || null;
          break;
        case 'maghrib':
          status = (task.maghribStatus as PrayerStatus) || null;
          break;
        case 'isha':
          status = (task.ishaStatus as PrayerStatus) || null;
          break;
        default:
          status = null;
      }

      console.log(`📊 Prayer status for ${prayerName}: ${status}`);
      return status;
    },
    [selectedDate, dailyTasks], // Now depends on reactive dailyTasks prop
  );

  // Convert prayer time string to hours and minutes for comparison
  const isPrayerInFuture = useCallback((prayerTimeStr: string) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Convert time string to 24-hour format
    let [hours, minutes] = prayerTimeStr.split(':').map(Number);

    // Add AM/PM conversion if needed
    if (prayerTimeStr.toLowerCase().includes('pm') && hours < 12) {
      hours += 12;
    } else if (prayerTimeStr.toLowerCase().includes('am') && hours === 12) {
      hours = 0;
    }

    // Compare times
    if (hours > currentHours) {
      return true;
    } else if (hours === currentHours && minutes > currentMinutes) {
      return true;
    }

    return false;
  }, []);

  // Format prayer time to AM/PM format without AM/PM text
  const formatPrayerTime = useCallback((timeString: string) => {
    // Check if already in the right format
    if (!timeString.includes(':')) return timeString;

    const [hoursStr, minutesStr] = timeString.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Convert to 12-hour format
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    // Format with padding for minutes, no AM/PM suffix
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  const handleAttendancePress = useCallback((prayer: PrayerTime) => {
    setSelectedPrayerForAttendance(prayer);
    setAttendancePopupVisible(true);
  }, []);

  const handleAttendanceSelect = useCallback(
    async (attendance: AttendanceType) => {
      if (!selectedPrayerForAttendance) {
        return;
      }

      try {
        // Close modal immediately for better UX
        setAttendancePopupVisible(false);
        setSelectedPrayerForAttendance(null);

        // Update prayer status using the enhanced hook with automatic sync
        const dateToUpdate = selectedDate || getTodayDateString();
        await updatePrayerStatus(
          dateToUpdate,
          selectedPrayerForAttendance.name.toLowerCase(),
          attendance,
        );

        console.log(
          `✅ Prayer ${selectedPrayerForAttendance.name} updated to ${attendance} for date ${dateToUpdate}`,
        );
      } catch (error) {
        console.error('❌ Prayer status update failed:', error);
        Alert.alert(
          'Update Failed',
          'Could not save prayer status. Please try again.',
        );
      }
    },
    [selectedPrayerForAttendance, updatePrayerStatus, selectedDate],
  );
  const handleModalClose = useCallback(() => {
    setAttendancePopupVisible(false);
    setSelectedPrayerForAttendance(null);
  }, []);

  return (
    <>
      {/* Prayer Cards Container */}
      <View style={styles.container}>
        <View style={styles.prayerCardsRow}>
          {prayers.map((prayer, index) => {
            const prayerStatus = getPrayerStatus(prayer.name);
            const isFuture = isToday && isPrayerInFuture(prayer.time);
            const formattedTime = formatPrayerTime(prayer.time);

            return (
              <TouchableOpacity
                key={index}
                style={styles.prayerColumn}
                onPress={() => {
                  // Only allow updating prayers for today and not future prayers
                  if (isToday && !isFuture) {
                    handleAttendancePress(prayer);
                  } else if (isToday && isFuture) {
                    Alert.alert(
                      'Future Prayer',
                      'You cannot mark future prayers',
                    );
                  } else {
                    Alert.alert(
                      'Past Date',
                      'You can only mark prayers for today',
                    );
                  }
                }}
                activeOpacity={isToday && !isFuture ? 0.7 : 0.9}>
                <View
                  style={[
                    styles.prayerCard,
                    prayer.isActive && styles.activeCard,
                    isToday && isFuture && styles.futurePrayerCard,
                  ]}>
                  <Text
                    style={
                      prayer.displayName === 'Maghrib'
                        ? styles.maghribName
                        : styles.prayerName
                    }
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}>
                    {prayer.displayName}
                  </Text>
                  <View style={styles.iconContainer}>
                    <SvgIcon
                      name={prayer.name.toLowerCase() as IconName}
                      size={26}
                    />
                    {isToday && selectedDate === getTodayDateString() && (
                      <>
                        {prayerStatus === 'mosque' && (
                          <View
                            style={[
                              styles.attendanceIndicator,
                              styles.mosqueIndicator,
                            ]}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                        {prayerStatus === 'home' && (
                          <View
                            style={[
                              styles.attendanceIndicator,
                              styles.homeIndicator,
                            ]}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                        {/* Only show cross when explicitly marked as 'none' (missed), not when null */}
                        {prayerStatus === 'none' && !isFuture && (
                          <View
                            style={[
                              styles.attendanceIndicator,
                              styles.missedIndicator,
                            ]}>
                            <Text style={styles.crossmark}>✕</Text>
                          </View>
                        )}
                        {/* We don't show any indicator when prayerStatus is null */}
                      </>
                    )}
                  </View>
                  <Text style={styles.prayerTime}>{formattedTime}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Attendance Selection Modal */}
      <AttendanceSelectionModal
        visible={attendancePopupVisible}
        currentAttendance={
          selectedPrayerForAttendance
            ? getPrayerStatus(selectedPrayerForAttendance.name)
            : null
        }
        onSelect={handleAttendanceSelect}
        onClose={handleModalClose}
        prayerName={selectedPrayerForAttendance?.displayName || ''}
        selectedDate={selectedDate} // Pass the selectedDate prop
        dailyTasks={dailyTasks} // ✅ FIXED: Pass reactive dailyTasks to maintain reactive chain
        isFuturePrayer={
          selectedPrayerForAttendance
            ? isPrayerInFuture(selectedPrayerForAttendance.time)
            : false
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.prayerCard,
    borderRadius: 20,
    padding: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    marginTop: 25,
    shadowColor: '#000000',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.102,
    shadowRadius: 9,
    elevation: 9,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    paddingVertical: 20,
  },
  loadingText: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    fontSize: 14,
  },
  prayerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prayerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  prayerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    width: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 110,
  },
  activeCard: {
    borderColor: '#4CE047',
  },
  futurePrayerCard: {
    opacity: 0.8,
  },
  prayerName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 12,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  maghribName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 12,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  prayerTime: {
    ...typography.prayerCard,
    fontSize: 13,
    color: colors.text.prayerBlue,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  iconContainer: {
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  attendanceIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  crossmark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  homeIndicator: {
    backgroundColor: '#4DABF7',
  },
  mosqueIndicator: {
    backgroundColor: colors.success,
  },
  missedIndicator: {
    backgroundColor: '#FF5252',
  },
});

// ✅ BRUTE FORCE: Maximum reactive configuration - observe ALL database changes
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
export default enhance(PrayerTimeCards);
