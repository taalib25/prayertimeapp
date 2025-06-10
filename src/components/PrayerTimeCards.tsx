import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import PrayerReminderModal from './PrayerReminderModal';
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

type AttendanceType = 'home' | 'masjid' | 'qaza' | 'none';

const MOCK_USER_ID = 1001;

const AttendancePopup: React.FC<{
  visible: boolean;
  currentAttendance: AttendanceType;
  onSelect: (attendance: AttendanceType) => void;
  onClose: () => void;
  prayerName: string;
}> = ({visible, currentAttendance, onSelect, onClose, prayerName}) => {
  const attendanceOptions = [
    {
      type: 'none' as AttendanceType,
      label: 'Not Prayed',
      color: colors.text.muted,
      opacity: 0.3,
      description: 'Mark as not prayed yet',
    },
    {
      type: 'home' as AttendanceType,
      label: 'At Home',
      color: colors.success,
      opacity: 1,
      description: 'Prayed individually at home',
    },
    {
      type: 'masjid' as AttendanceType,
      label: 'At Masjid',
      color: colors.primary,
      opacity: 1,
      description: 'Prayed in congregation at masjid',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.popupOverlay} onPress={onClose}>
        <View style={styles.popupContainer}>
          <Text style={styles.popupTitle}>{prayerName} Prayer Status</Text>
          <Text style={styles.popupSubtitle}>
            Select your prayer attendance
          </Text>

          {attendanceOptions.map(option => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.popupOption,
                currentAttendance === option.type && styles.popupOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.type);
                onClose();
              }}>
              <View style={styles.popupOptionContent}>
                <View
                  style={[
                    styles.popupCircle,
                    {
                      backgroundColor: option.color,
                      opacity: option.opacity,
                    },
                  ]}
                />
                <View style={styles.popupTextContainer}>
                  <Text style={styles.popupOptionLabel}>{option.label}</Text>
                  <Text style={styles.popupOptionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {currentAttendance === option.type && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

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

  const handleAttendanceToggle = useCallback(
    async (prayerName: string) => {
      const today = new Date().toISOString().split('T')[0];
      const currentStatus = getPrayerStatus(prayerName);
      const currentAttendance = getAttendanceType(currentStatus);

      let newStatus: PrayerStatus;

      // Cycle through: none -> home -> masjid -> Missed
      switch (currentAttendance) {
        case 'none':
          newStatus = 'individual'; // home
          break;
        case 'home':
          newStatus = 'jamath'; // masjid
          break;
        case 'masjid':
          newStatus = 'pending'; // none
          break;
        default:
          newStatus = 'individual';
      }

      await updatePrayerForDate(today, prayerName, newStatus);
    },
    [getPrayerStatus, getAttendanceType, updatePrayerForDate],
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
        return colors.primary; // Blue for masjid
      case 'qaza':
        return '#FF9800'; // Orange for qaza (makeup prayer)
      case 'none':
      default:
        return colors.text.muted; // Gray for none
    }
  };

  const getAttendanceOpacity = (attendance: AttendanceType) => {
    return attendance === 'none' ? 0.3 : 1;
  };

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

              {/* Larger Attendance Indicator with Tooltip */}
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
                  ]}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Attendance Selection Popup */}
      {selectedPrayerForAttendance && (
        <AttendancePopup
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
    padding: 8,
    marginHorizontal: 8,
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
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  // Popup styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popupTitle: {
    ...typography.h3,
    color: colors.text.prayerBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  popupSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  popupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background.light,
  },
  popupOptionSelected: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  popupOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  popupCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  popupTextContainer: {
    flex: 1,
  },
  popupOptionLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  popupOptionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PrayerTimeCards;
