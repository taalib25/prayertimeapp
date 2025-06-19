import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import AttendanceSelectionModal, {
  AttendanceType,
} from './AttendanceSelectionModal';
import {PrayerStatus} from '../model/DailyTasks';
import {
  updatePrayerStatus,
  createDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';
import {Q} from '@nozbe/watermelondb';
import { getTodayDateString } from '../utils/helpers';

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

  // Simple local state for immediate UI updates
  const [localPrayerStatuses, setLocalPrayerStatuses] = useState<
    Record<string, PrayerStatus>
  >({});

  // Current day's task data
  const [todayData, setTodayData] = useState<DailyTaskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const getTodayTask = useCallback(async (): Promise<DailyTaskData> => {
    try {
      const todayStr = getTodayDateString();
      console.log(`📅 Today's date: ${todayStr}`);

      const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

      // Try to get the latest task
      const latestTasks = await dailyTasksCollection
        .query(Q.sortBy('date', Q.desc), Q.take(1))
        .fetch();

      if (latestTasks.length > 0) {
        const latestTask = latestTasks[0];
        if (latestTask.date === todayStr) {
          console.log(`✅ Found today's task: ${latestTask.date}`);
          return {
            date: latestTask.date,
            fajrStatus: latestTask.fajrStatus as PrayerStatus,
            dhuhrStatus: latestTask.dhuhrStatus as PrayerStatus,
            asrStatus: latestTask.asrStatus as PrayerStatus,
            maghribStatus: latestTask.maghribStatus as PrayerStatus,
            ishaStatus: latestTask.ishaStatus as PrayerStatus,
            totalZikrCount: latestTask.totalZikrCount,
            quranMinutes: latestTask.quranMinutes || 0,
            specialTasks: latestTask.specialTasks
              ? JSON.parse(latestTask.specialTasks)
              : [],
          };
        }
      }

      // If no task for today exists, create a new one
      console.log(`📝 Creating new task for today: ${todayStr}`);
      return await createDailyTasks(todayStr);
    } catch (error) {
      console.error("❌ Error getting today's task:", error);
      throw error;
    }
  }, [getTodayDateString]);

  // Load today's data on component mount
  useEffect(() => {
    const loadTodayData = async () => {
      try {
        setIsLoading(true);
        const data = await getTodayTask();
        console.log(`📅 Today's task loaded: ${data.date}`);
        setTodayData(data);
      } catch (error) {
        console.error("❌ Failed to load today's data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayData();
  }, [getTodayTask]);

  const getPrayerStatus = useCallback(
    (prayerName: string): PrayerStatus => {
      const lcPrayerName = prayerName.toLowerCase();

      // Check local state first (for immediate UI updates)
      if (localPrayerStatuses[lcPrayerName]) {
        return localPrayerStatuses[lcPrayerName];
      }

      // Fall back to database data
      if (!todayData || isLoading) return 'none';

      switch (lcPrayerName) {
        case 'fajr':
          return todayData.fajrStatus as PrayerStatus;
        case 'dhuhr':
          return todayData.dhuhrStatus as PrayerStatus;
        case 'asr':
          return todayData.asrStatus as PrayerStatus;
        case 'maghrib':
          return todayData.maghribStatus as PrayerStatus;
        case 'isha':
          return todayData.ishaStatus as PrayerStatus;
        default:
          return 'none';
      }
    },
    [todayData, localPrayerStatuses, isLoading],
  );

  const handleAttendancePress = useCallback((prayer: PrayerTime) => {
    setSelectedPrayerForAttendance(prayer);
    setAttendancePopupVisible(true);
  }, []);
  const handleAttendanceSelect = useCallback(
    async (attendance: AttendanceType) => {
      if (!selectedPrayerForAttendance) return;

      const prayerName = selectedPrayerForAttendance.name.toLowerCase();
      const newStatus: PrayerStatus = attendance;

      // 1. UPDATE UI IMMEDIATELY (optimistic update)
      setLocalPrayerStatuses(prev => ({
        ...prev,
        [prayerName]: newStatus,
      }));

      // 2. CLOSE MODAL IMMEDIATELY
      setAttendancePopupVisible(false);
      setSelectedPrayerForAttendance(null); // 3. UPDATE DATABASE IN BACKGROUND
      try {
        const todayStr = getTodayDateString();

        await updatePrayerStatus(todayStr, prayerName, newStatus);
        console.log(
          `✅✅✅✅✅ Database updated: ${prayerName} = ${newStatus} = ${todayStr}`,
        );

        // 4. UPDATE LOCAL STATE TO REFLECT DATABASE CHANGES
        setTodayData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [`${prayerName}Status`]: newStatus,
          } as DailyTaskData;
        });

        // 5. CLEAR OPTIMISTIC UPDATE SINCE DATABASE IS NOW UPDATED
        setLocalPrayerStatuses(prev => {
          const updated = {...prev};
          delete updated[prayerName];
          return updated;
        });
      } catch (error) {
        console.error('❌ Database update failed:', error);

        // 4. REVERT UI IF DATABASE UPDATE FAILS
        setLocalPrayerStatuses(prev => {
          const updated = {...prev};
          delete updated[prayerName]; // Remove local override to show database state
          return updated;
        });
        Alert.alert(
          'Update Failed',
          'Could not save prayer status. Please try again.',
        );
      }
    },
    [selectedPrayerForAttendance, getTodayDateString],
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
                      {(prayerStatus === 'home' ||
                        prayerStatus === 'mosque') && (
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
            : 'none'
        }
        onSelect={handleAttendanceSelect}
        onClose={handleModalClose}
        prayerName={selectedPrayerForAttendance?.displayName || ''}
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
  homeIndicator: {
    backgroundColor: '#4DABF7',
  },
  mosqueIndicator: {
    backgroundColor: colors.success,
  },
});

export default PrayerTimeCards;
