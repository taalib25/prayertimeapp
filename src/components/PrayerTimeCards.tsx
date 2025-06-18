import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import PrayerReminderModal from './PrayerReminderModal';
import AttendanceSelectionModal, {
  AttendanceType,
} from './AttendanceSelectionModal';
import {useRecentDailyTasks} from '../hooks/useDailyTasks';
import {PrayerStatus} from '../model/DailyTasks';
import { updatePrayerRecord } from '../services/ApiExamples';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
}

const MOCK_USER_ID = 1001;

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({prayers}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime | null>(null);
  const [reminderType, setReminderType] = useState<'notification' | 'alarm'>(
    'notification',
  );
  const [attendancePopupVisible, setAttendancePopupVisible] = useState(false);
  const [selectedPrayerForAttendance, setSelectedPrayerForAttendance] =
    useState<PrayerTime | null>(null);

  const {recentTasks, updatePrayerForDate} = useRecentDailyTasks({
    uid: MOCK_USER_ID,
    daysBack: 1,
  });

  // Get today's task data
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return recentTasks.find(task => task.date === today);
  }, [recentTasks]);

  const getPrayerStatus = useCallback(
    (prayerName: string): PrayerStatus => {
      if (!todayData) return 'pending';

      // Access prayer status properties directly from the data
      switch (prayerName.toLowerCase()) {
        case 'fajr':
          return (todayData.fajrStatus as PrayerStatus) || 'pending';
        case 'dhuhr':
          return (todayData.dhuhrStatus as PrayerStatus) || 'pending';
        case 'asr':
          return (todayData.asrStatus as PrayerStatus) || 'pending';
        case 'maghrib':
          return (todayData.maghribStatus as PrayerStatus) || 'pending';
        case 'isha':
          return (todayData.ishaStatus as PrayerStatus) || 'pending';
        default:
          return 'pending';
      }
    },
    [todayData],
  );

  const getAttendanceType = useCallback(
    (status: PrayerStatus): AttendanceType => {
      switch (status) {
        case 'individual':
          return 'home';
        case 'jamath':
        case 'completed':
          return 'masjid';
        default:
          return 'none';
      }
    },
    [],
  );

  const handleAttendancePress = useCallback((prayer: PrayerTime) => {
    setSelectedPrayerForAttendance(prayer);
    setAttendancePopupVisible(true);
  }, []);

  const handleAttendanceSelect = useCallback(
    async (attendance: AttendanceType) => {
      if (!selectedPrayerForAttendance) return;

      const today = new Date().toISOString().split('T')[0];
      let newStatus: PrayerStatus;

      switch (attendance) {
        case 'home':
          newStatus = 'individual';
          break;
        case 'masjid':
          newStatus = 'jamath';
          break;
        case 'none':
        default:
          newStatus = 'pending';
          break;
      }

      //added the prayer api call to update the prayer status
      await updatePrayerForDate(
        today,
        selectedPrayerForAttendance.name,
        newStatus,
      );
    console.log(
    
       selectedPrayerForAttendance.name, // prayerType
        today,// prayerDate
        (attendance === 'masjid' || attendance === 'home') ? 'prayed' : 'missed', // status
        attendance === 'masjid' ? 'mosque' : attendance === 'home' ? 'home' : undefined, // location
    );

    //dhuhr dhuhr 2025-06-17 individual home

      await updatePrayerRecord(
        selectedPrayerForAttendance.name, // prayerType
        today,// prayerDate
        (attendance === 'masjid' || attendance === 'home') ? 'prayed' : 'missed', // status
        attendance === 'masjid' ? 'mosque' : attendance === 'home' ? 'home' : undefined, // location
      );
    },
    [selectedPrayerForAttendance, updatePrayerForDate],
  );

  const handleLongPress = (prayer: PrayerTime) => {
    setSelectedPrayer(prayer);
    setReminderType('notification');
    setModalVisible(true);
  };

  return (
    <>
      {/* Prayer Cards Container */}
      <View style={styles.container}>
        <View style={styles.prayerCardsRow}>
          {prayers.map((prayer, index) => {
            const prayerStatus = getPrayerStatus(prayer.name);
            const attendanceType = getAttendanceType(prayerStatus);

            return (
              <TouchableOpacity
                key={index}
                style={styles.prayerColumn}
                onPress={() => handleAttendancePress(prayer)}
                onLongPress={() => handleLongPress(prayer)}
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
                    {attendanceType !== 'none' && (
                      <View style={styles.attendanceIndicator}>
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
      </View>
      {/* Modals */}
      {selectedPrayerForAttendance && (
        <AttendanceSelectionModal
          visible={attendancePopupVisible}
          currentAttendance={getAttendanceType(
            getPrayerStatus(selectedPrayerForAttendance.name),
          )}
          onSelect={handleAttendanceSelect}
          onClose={() => {
            setAttendancePopupVisible(false);
            setSelectedPrayerForAttendance(null);
          }}
          prayerName={selectedPrayerForAttendance.displayName}
        />
      )}
      {/* {selectedPrayer && (
        <PrayerReminderModal
          visible={modalVisible}
          onClose={closeModal}
          prayerName={selectedPrayer.displayName}
          prayerTime={selectedPrayer.time}
          isNotification={reminderType === 'notification'}
        />
      )} */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.prayerCard,
    borderRadius: 20,
    padding: 1,
    paddingTop: 16, // Increased top padding
    paddingHorizontal: 16, // Increased horizontal padding
    marginTop: 25,
    shadowColor: '#000000',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.102,
    shadowRadius: 9,
    elevation: 9,
    // marginBottom: 20,
  },
  prayerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12, // Increased bottom margin
  },
  prayerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2, // Added horizontal margin between columns
  },
  prayerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Increased vertical padding
    paddingHorizontal: 4, // Increased horizontal padding
    width: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    // marginBottom: 8, // Increased space between card and attendance
    minHeight: 110, // Added minimum height to prevent cramping
  },
  activeCard: {
    borderColor: '#4CE047',
  },
  prayerName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 12, // Slightly reduced but still spacious
    fontSize: 13, // Slightly reduced font size to prevent wrapping
    textAlign: 'center',
    lineHeight: 16, // Added line height for better text spacing
  },
  maghribName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 12,
    fontSize: 13, // Smaller font size specifically for Maghrib
    textAlign: 'center',
    lineHeight: 16, // Slightly bolder to maintain readability
  },
  prayerTime: {
    ...typography.prayerCard,
    fontSize: 13, // Slightly reduced font size to prevent wrapping
    color: colors.text.prayerBlue,
    marginTop: 12, // Reduced top margin
    marginBottom: 6, // Increased bottom margin
    textAlign: 'center',
    lineHeight: 16, // Added line height for better text spacing
  },
  iconContainer: {
    height: 32, // Increased height for better spacing
    width: 32, // Added width for consistent sizing
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  attendanceIndicator: {
    position: 'absolute',
    top: -6, // Adjusted position
    right: -6, // Adjusted position
    width: 16, // Slightly larger for better visibility
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
    fontSize: 9, // Slightly larger for better visibility
    fontWeight: 'bold',
    lineHeight: 12,
  },
});

export default PrayerTimeCards;
