import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import AttendanceSelectionModal, {
  AttendanceType,
} from './AttendanceSelectionModal';
import {useRecentDailyTasks} from '../hooks/useDailyTasks';
import {PrayerStatus} from '../model/DailyTasks';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
}

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({prayers}) => {
  const [attendancePopupVisible, setAttendancePopupVisible] = useState(false);
  const [selectedPrayerForAttendance, setSelectedPrayerForAttendance] =
    useState<PrayerTime | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const {recentTasks, updatePrayerForDate, forceRefresh, isLoading, error} =
    useRecentDailyTasks({
      daysBack: 1,
    });

  // Get today's task data with better error handling
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const data = recentTasks.find(task => task.date === today)

    return data || null;
  }, [recentTasks, isLoading]);

  // Auto-refresh when component mounts or when needed
  useEffect(() => {
    if (!todayData && !isLoading && recentTasks.length === 0) {
      console.log('🔄 No today data found, forcing refresh...');
      forceRefresh();
    }
  }, [todayData, isLoading, recentTasks.length, forceRefresh]);

  const getPrayerStatus = useCallback(
    (prayerName: string): PrayerStatus => {
      if (!todayData) {
        console.log(`❌ No todayData available for ${prayerName}`);
        return 'none';
      }

      const lcPrayerName = prayerName.toLowerCase();

      let status: PrayerStatus;
      switch (lcPrayerName) {
        case 'fajr':
          status = todayData.fajrStatus as PrayerStatus;
          break;
        case 'dhuhr':
          status = todayData.dhuhrStatus as PrayerStatus;
          break;
        case 'asr':
          status = todayData.asrStatus as PrayerStatus;
          break;
        case 'maghrib':
          status = todayData.maghribStatus as PrayerStatus;
          break;
        case 'isha':
          status = todayData.ishaStatus as PrayerStatus;
          break;
        default:
          status = 'none';
      }

      console.log(
        `📊 getPrayerStatus: ${lcPrayerName} = "${status}" (from todayData)`,
      );
      return status;
    },
    [todayData],
  );

  const getAttendanceType = useCallback(
    (status: PrayerStatus): AttendanceType => {
      console.log(`🔍 Converting status "${status}" to attendance type`);

      // Direct mapping - make sure this matches exactly what we store
      if (status === 'home') {
        return 'home';
      } else if (status === 'mosque') {
        return 'mosque';
      } else {
        return 'none';
      }
    },
    [],
  );

  const handleAttendancePress = useCallback((prayer: PrayerTime) => {
    console.log(`Opening modal for prayer: ${prayer.name}`);
    setSelectedPrayerForAttendance(prayer);
    setAttendancePopupVisible(true);
  }, []);
  const handleAttendanceSelect = useCallback(
    async (attendance: AttendanceType) => {
      if (!selectedPrayerForAttendance || isUpdating) {
        console.log('⏸️ Cannot update: no prayer selected or already updating');
        return;
      }

      setIsUpdating(true);

      const today = new Date().toISOString().split('T')[0];
      let newStatus: PrayerStatus = 'none';

      // Clear mapping
      if (attendance === 'home') {
        newStatus = 'home';
      } else if (attendance === 'mosque') {
        newStatus = 'mosque';
      } else {
        newStatus = 'none';
      }

      console.log(
        `🎯 MODAL SELECTION: ${attendance} -> ${newStatus} for ${selectedPrayerForAttendance.name}`,
      );

      try {
        const prayerName = selectedPrayerForAttendance.name.toLowerCase();

        console.log(
          `🔄 Starting database update: ${prayerName} => ${newStatus}`,
        );

        // Update in database - the hook will handle refreshing
        await updatePrayerForDate(today, prayerName, newStatus);

        console.log(`📱 Database update call completed`);

        // Wait a bit more for state to update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verify the update worked
        const updatedData = recentTasks.find(task => task.date === today);
        if (updatedData) {
          const updatedStatus = getPrayerStatus(prayerName);
          console.log(
            `🔍 Final verification: ${prayerName} status is "${updatedStatus}"`,
          );

          if (updatedStatus === newStatus) {
            console.log(`✅ SUCCESS: Status correctly updated to ${newStatus}`);
          } else {
            console.log(
              `❌ FAILED: Expected "${newStatus}", got "${updatedStatus}"`,
            );
            // Force another refresh if the status doesn't match
            console.log('🔄 Forcing additional refresh...');
            await forceRefresh();
          }
        }
      } catch (error) {
        console.error('❌ Failed to update prayer status:', error);
        Alert.alert(
          'Update Failed',
          `Could not update prayer status. Please try again.`,
        );
      } finally {
        setIsUpdating(false);
        // Close modal after everything is done
        setAttendancePopupVisible(false);
        setSelectedPrayerForAttendance(null);
      }
    },
    [
      selectedPrayerForAttendance,
      isUpdating,
      updatePrayerForDate,
      recentTasks,
      getPrayerStatus,
      forceRefresh,
    ],
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
            const attendanceType = getAttendanceType(prayerStatus);

            // Enhanced logging for debugging
            console.log(
              `🎨 Rendering ${prayer.name}: status="${prayerStatus}", type="${attendanceType}"`,
            );

            return (
              <TouchableOpacity
                key={index}
                style={styles.prayerColumn}
                onPress={() => handleAttendancePress(prayer)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.prayerCard,
                    prayer.isActive && styles.activeCard,
                    prayerStatus === 'home' && styles.homeCard,
                    prayerStatus === 'mosque' && styles.mosqueCard,
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
                    {/* Show indicator for both home and mosque */}
                    {(prayerStatus === 'home' || prayerStatus === 'mosque') && (
                      <View
                        style={[
                          styles.attendanceIndicator,
                          prayerStatus === 'home'
                            ? styles.homeIndicator
                            : styles.mosqueIndicator,
                        ]}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.prayerTime} numberOfLines={1}>
                    {prayer.time}
                  </Text>

                  {/* DEBUG: Show both status and attendance type */}
                  <Text style={{fontSize: 8, color: '#999', marginTop: 2}}>
                    {prayerStatus} | {attendanceType}
                  </Text>
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
            ? getAttendanceType(
                getPrayerStatus(selectedPrayerForAttendance.name),
              )
            : 'none'
        }
        onSelect={handleAttendanceSelect}
        onClose={handleModalClose}
        prayerName={selectedPrayerForAttendance?.displayName || ''}
        isUpdating={isUpdating}
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
  homeCard: {
    borderColor: '#4DABF7',
  },
  mosqueCard: {
    borderColor: '#4CE047',
  },
  homeIndicator: {
    backgroundColor: '#4DABF7',
  },
  mosqueIndicator: {
    backgroundColor: colors.success,
  },
});

export default PrayerTimeCards;
