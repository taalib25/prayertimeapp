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

      await updatePrayerForDate(
        today,
        selectedPrayerForAttendance.name,
        newStatus,
      );
    },
    [selectedPrayerForAttendance, updatePrayerForDate],
  );

  const handleLongPress = (prayer: PrayerTime) => {
    setSelectedPrayer(prayer);
    setReminderType('notification');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPrayer(null);
  };

  const getAttendanceColor = (attendance: AttendanceType) => {
    switch (attendance) {
      case 'home':
        return colors.success; // Green for home
      case 'masjid':
        return colors.text.prayerBlue; // Prayer blue for masjid
      case 'none':
      default:
        return colors.text.muted; // Gray for none
    }
  };

  const getAttendanceOpacity = (attendance: AttendanceType) => {
    return attendance === 'none' ? 0.3 : 1;
  };

  return (
    <View style={styles.container}>
      <View style={styles.prayerCardsRow}>
        {prayers.map((prayer, index) => {
          const prayerStatus = getPrayerStatus(prayer.name);
          const attendanceType = getAttendanceType(prayerStatus);

          return (
            <View key={index} style={styles.prayerCardContainer}>
              <TouchableOpacity
                style={[
                  styles.prayerCard,
                  prayer.isActive && styles.activeCard,
                ]}
                onLongPress={() => handleLongPress(prayer)}
                delayLongPress={800}
                activeOpacity={0.7}>
                <Text style={styles.prayerName}>{prayer.displayName}</Text>

                <View style={styles.iconContainer}>
                  <SvgIcon
                    name={prayer.name.toLowerCase() as IconName}
                    size={22}
                    color={colors.accent}
                  />
                </View>

                <Text style={styles.prayerTime}>{prayer.time}</Text>
              </TouchableOpacity>

              {/* Enhanced Attendance Indicator */}
              <TouchableOpacity
                style={styles.attendanceContainer}
                onPress={() => handleAttendancePress(prayer)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.attendanceCircle,
                    {
                      backgroundColor: getAttendanceColor(attendanceType),
                      opacity: getAttendanceOpacity(attendanceType),
                    },
                  ]}>
                  {attendanceType !== 'none' && (
                    <Text style={styles.attendanceCheckmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Attendance Selection Modal */}
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

      {selectedPrayer && (
        <PrayerReminderModal
          visible={modalVisible}
          onClose={closeModal}
          prayerName={selectedPrayer.displayName}
          prayerTime={selectedPrayer.time}
          isNotification={reminderType === 'notification'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.prayerCard,
    borderRadius: 20,
    padding: 5,
    marginHorizontal: 1,
    marginTop: 10,
    marginBottom: 16,
  },
  prayerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prayerCardContainer: {
    flex: 1,
    alignItems: 'center',
  },
  prayerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: '100%',
  },
  activeCard: {
    borderRadius: 12,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  prayerName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 13,
    textAlign: 'center',
  },
  prayerTime: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginTop: 15,
    textAlign: 'center',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceContainer: {
    marginTop: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceCircle: {
    width: 24,
    height: 24,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  attendanceCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PrayerTimeCards;
