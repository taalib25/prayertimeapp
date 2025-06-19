import React, {useState, useCallback} from 'react';
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

  // Use centralized prayer data
  const {getPrayerStatus, updatePrayerStatus, isLoading} = usePrayerData();

  const handleAttendancePress = useCallback((prayer: PrayerTime) => {
    setSelectedPrayerForAttendance(prayer);
    setAttendancePopupVisible(true);
  }, []);

  const handleAttendanceSelect = useCallback(
    async (attendance: AttendanceType) => {
      if (!selectedPrayerForAttendance) return;

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
