import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';
import {colors} from '../utils/theme';
import {fontFamilies, typography} from '../utils/typography';
import {getTodayDateString} from '../utils/helpers';
import {updatePrayerStatus} from '../services/db/dailyTaskServices';

export type AttendanceType = 'home' | 'mosque' | 'none' | null;

// Option configuration for cleaner rendering - Focus on Masjid and None
const ATTENDANCE_OPTIONS = [
  {
    type: 'mosque' as AttendanceType,
    label: 'Yes',
    description: 'Prayed at Masjid',
    priority: 1, // Main focus option
  },
  {
    type: 'none' as AttendanceType,
    label: 'No',
    description: 'Did not pray',
    priority: 2,
  },
  // {
  //   type: 'home' as AttendanceType,
  //   label: 'At Home',
  //   description: 'Prayed individually',
  // },
];

interface AttendanceSelectionModalProps {
  visible: boolean;
  currentAttendance: AttendanceType;
  onSelect: (attendance: AttendanceType) => void;
  onClose: () => void;
  prayerName: string;
  isFuturePrayer?: boolean; // Added prop to identify future prayers
  selectedDate?: string; // Add selectedDate prop
  dailyTasks: DailyTasksModel[]; // Added for withObservables
}

const AttendanceSelectionModal: React.FC<AttendanceSelectionModalProps> = ({
  visible,
  currentAttendance,
  onSelect,
  onClose,
  prayerName,
  isFuturePrayer = false,
  selectedDate,
  dailyTasks, // Now comes from withObservables
}) => {
  // Animation values
  const slideAnim = useSharedValue(100);
  const scaleAnim = useSharedValue(0.97);
  const opacityAnim = useSharedValue(0);

  // ✅ FIX: Get actual prayer status from database instead of using currentAttendance prop
  const actualPrayerStatus = React.useMemo(() => {
    const dateToCheck = selectedDate || getTodayDateString();
    
    // Log all available tasks to help debug
    console.log(`🔍 Modal: Looking for ${prayerName} status on ${dateToCheck}`);
    console.log(`📋 Available dates: ${dailyTasks.map(t => t.date).join(', ')}`);
    
    // Improved task lookup with additional logging
    const task = dailyTasks.find(t => {
      const matches = t.date === dateToCheck;
      if (matches) {
        console.log(`✅ Found matching task for ${dateToCheck}: ${t.id}`);
      }
      return matches;
    });

    console.log(`📋 Modal: Found task:`, task ? `ID: ${task.id}` : 'none');

    if (!task) {
      console.log(`📅 No task found for date ${dateToCheck}`);
      return null;
    }

    const prayerField =
      `${prayerName.toLowerCase()}Status` as keyof DailyTasksModel;
    const status = task[prayerField] as string;

    console.log(
      `🔍 AttendanceModal: ${prayerName} status for ${dateToCheck}: ${status}`,
    );
    return status as AttendanceType;
  }, [dailyTasks, selectedDate, prayerName]);

  // ✅ REACTIVE: Force re-render when the modal becomes visible
  React.useEffect(() => {
    if (visible) {
      console.log(`🔄 Modal for ${prayerName} opened - refreshing data`);
      // Force WatermelonDB to refresh this query when modal opens
      database.get<DailyTasksModel>('daily_tasks')
        .query(Q.sortBy('date', Q.desc))
        .fetch()
        .then(tasks => {
          console.log(`📊 Modal refresh: got ${tasks.length} tasks`);
        })
        .catch(err => {
          console.error('❌ Error refreshing tasks in modal:', err);
        });
    }
  }, [visible, prayerName]);

  React.useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, {damping: 20, stiffness: 300});
      scaleAnim.value = withSpring(1, {damping: 20, stiffness: 300});
      opacityAnim.value = withTiming(1, {duration: 300});
    } else {
      slideAnim.value = withTiming(300, {duration: 250});
      scaleAnim.value = withTiming(0.97, {duration: 250});
      opacityAnim.value = withTiming(0, {duration: 250});
    }
  }, [visible, slideAnim, scaleAnim, opacityAnim]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{translateY: slideAnim.value}, {scale: scaleAnim.value}],
    opacity: opacityAnim.value,
  }));

  // ✅ SIMPLIFIED: Direct update without complex state management
  const handleSelect = async (attendance: AttendanceType) => {
    // if (isFuturePrayer) return;

    try {
      const dateToUpdate = selectedDate || getTodayDateString();

      console.log(
        `🔄 AttendanceModal: Updating ${prayerName} to ${attendance} for ${dateToUpdate}`,
      );

      // Update database directly - WatermelonDB will handle reactive updates
      await updatePrayerStatus(
        dateToUpdate,
        prayerName.toLowerCase(),
        attendance,
      );

      // Close modal immediately for better UX
      onClose();

      // Call parent callback for any additional logic
      onSelect(attendance);

      console.log(
        `✅ AttendanceModal: Successfully updated ${prayerName} to ${attendance}`,
      );
    } catch (error) {
      console.error('❌ AttendanceModal: Update failed:', error);
      onSelect(attendance); // Still notify parent
    }
  }; // ✅ ENHANCED: Render option using actual database status with improved logging
  const renderOption = (option: any) => {
    // Explicitly log the status comparison to track reactivity issues
    console.log(`🔍 Option ${option.type} vs actualStatus=${actualPrayerStatus}`);
    
    const isSelected = actualPrayerStatus === option.type;
    const isMasjid = option.type === 'mosque';
    const isNone = option.type === 'none';

    console.log(
      `🎨 Rendering ${option.type}: selected=${isSelected}, actualStatus=${actualPrayerStatus}`,
    );

    const getButtonStyle = () => {
      if (isSelected && isMasjid) {
        return [styles.optionButton, styles.selectedYesButton];
      } else if (isSelected && isNone) {
        return [styles.optionButton, styles.selectedNoButton];
      } else {
        return [styles.optionButton, styles.unselectedButton];
      }
    };

    const getTextStyle = () => {
      if (isSelected && isMasjid) {
        return [styles.optionLabel, styles.selectedYesText];
      } else if (isSelected && isNone) {
        return [styles.optionLabel, styles.selectedNoText];
      } else {
        return [styles.optionLabel, styles.unselectedText];
      }
    };

    return (
      <TouchableOpacity
        key={option.type}
        style={[getButtonStyle(), isFuturePrayer && styles.disabledButton]}
        onPress={() => handleSelect(option.type)}
        activeOpacity={isFuturePrayer ? 1 : 0.8}>
        <Text style={getTextStyle()}>{option.label}</Text>
        <Text
          style={[
            styles.optionDescription,
            isSelected && styles.selectedDescription,
          ]}>
          {option.description}
        </Text>
        {/* Show cross symbol when "No" is selected */}
        {isNone && isSelected && <Text style={styles.crossSymbol}>✖</Text>}
      </TouchableOpacity>
    );
  };
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      // statusBarTranslucent
      >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          {/* Header with improved hierarchy */}
          <View style={styles.header}>
            <Text style={styles.prayerTitle}>{prayerName}</Text>
            <View style={styles.questionContainer}>
              <Text style={styles.subtitle}>Prayed at Masjid?</Text>
              {isFuturePrayer && (
                <Text style={styles.futureWarning}>
                  Cannot mark future prayers
                </Text>
              )}
            </View>
          </View>
          {/* Options List */}
          <View style={styles.optionsContainer}>
            {ATTENDANCE_OPTIONS.map(renderOption)}
          </View>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: colors.background.dark,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  prayerTitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 28,
    color: colors.text.accent,
    marginBottom: -5,
    lineHeight: 32,
  },
  questionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  subtitle: {
    ...typography.h2,
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 4,
  },
  helpText: {
    ...typography.caption,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  futureWarning: {
    ...typography.caption,
    fontSize: 14,
    color: '#FFD700',
    fontStyle: 'italic',
    marginTop: 4,
  },
  optionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 64,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedYesButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    elevation: 4,
    shadowOpacity: 0.2,
  },
  selectedNoButton: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
    elevation: 4,
    shadowOpacity: 0.2,
  },
  unselectedButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  disabledButton: {
    opacity: 0.6,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedYesText: {
    color: '#FFFFFF',
  },
  selectedNoText: {
    color: '#FFFFFF',
  },
  unselectedText: {
    color: '#333333',
  },
  optionDescription: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666666',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  closeText: {
    ...typography.button,
    color: '#666',
  },
  statusDisplay: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusDisplayText: {
    ...typography.caption,
    color: '#666',
    fontStyle: 'italic',
  },
  crossSymbol: {
    fontSize: 24,
    color: '#FF5252',
    marginTop: 4,
  },
});

// ✅ BRUTE FORCE: Maximum reactive configuration with enhanced debugging
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

const EnhancedAttendanceSelectionModal = enhance(AttendanceSelectionModal);

export default EnhancedAttendanceSelectionModal;
