import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import AttendanceSelectionModal, {
  AttendanceType,
} from './AttendanceSelectionModal';
import {PrayerStatus} from '../model/DailyTasks';
import {usePrayerData} from '../hooks/useContextualData';
import {getTodayDateString} from '../utils/helpers';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
  selectedDate?: string; // Add optional selectedDate prop
}

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({
  prayers,
  selectedDate,
}) => {
  const [attendancePopupVisible, setAttendancePopupVisible] = useState(false);
  const [selectedPrayerForAttendance, setSelectedPrayerForAttendance] =
    useState<PrayerTime | null>(null); // Use centralized prayer data - pass selectedDate to get data for that specific date
  // But tick marks should only show for today's date regardless
  const {getPrayerStatus, updatePrayerStatus, isLoading, todayData} =
    usePrayerData(selectedDate);
  const isToday = useMemo(() => {
    const today = getTodayDateString();
    return selectedDate === today;
  }, [selectedDate]);

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

        // Update via context - this will refresh all UIs automatically
        await updatePrayerStatus(
          selectedPrayerForAttendance.name.toLowerCase(),
          attendance,
        );

        console.log(
          `✅ Prayer ${selectedPrayerForAttendance.name} updated to ${attendance}`,
        );
      } catch (error) {
        console.error('❌ Prayer status update failed:', error);
        Alert.alert(
          'Update Failed',
          'Could not save prayer status. Please try again.',
        );
      }
    },
    [selectedPrayerForAttendance, updatePrayerStatus],
  );
  const handleModalClose = useCallback(() => {
    setAttendancePopupVisible(false);
    setSelectedPrayerForAttendance(null);
  }, []);

  return (
    <>
      {/* Prayer Cards Container */}
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading prayers...</Text>
          </View>
        ) : (
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
        )}
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
        isFuturePrayer={
          selectedPrayerForAttendance &&
          isPrayerInFuture(selectedPrayerForAttendance.time)
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

export default PrayerTimeCards;
