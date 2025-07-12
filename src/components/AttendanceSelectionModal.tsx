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
  runOnJS,
} from 'react-native-reanimated';
import {colors} from '../utils/theme';
import {fontFamilies, typography} from '../utils/typography';
import {useDailyTasks} from '../hooks/useDailyTasks';
import {getTodayDateString} from '../utils/helpers';

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
}

const AttendanceSelectionModal: React.FC<AttendanceSelectionModalProps> = ({
  visible,
  currentAttendance,
  onSelect,
  onClose,
  prayerName,
  isFuturePrayer = false, // Default to false
  selectedDate, // Add selectedDate prop
}) => {
  // Use the enhanced useDailyTasks hook for reactive data updates
  const {updatePrayerStatus} = useDailyTasks();

  // Animation values
  const slideAnim = useSharedValue(300);
  const scaleAnim = useSharedValue(0.97); // Reduced scaling effect
  const opacityAnim = useSharedValue(0);

  // Start animation when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, {damping: 20, stiffness: 300});
      scaleAnim.value = withSpring(1, {damping: 20, stiffness: 300});
      opacityAnim.value = withTiming(1, {duration: 300});
    } else {
      slideAnim.value = withTiming(300, {duration: 250});
      scaleAnim.value = withTiming(0.97, {duration: 250}); // Reduced scaling effect
      opacityAnim.value = withTiming(0, {duration: 250});
    }
  }, [visible]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{translateY: slideAnim.value}, {scale: scaleAnim.value}],
    opacity: opacityAnim.value,
  }));

  // Enhanced selection handler with WatermelonDB reactive updates
  const handleSelect = async (attendance: AttendanceType) => {
    // Don't allow selection for future prayers
    if (isFuturePrayer) return;

    try {
      // // Add a small bounce animation on selection - reduced scaling
      // scaleAnim.value = withSpring(0.99, {duration: 100}, () => {
      //   scaleAnim.value = withSpring(1, {duration: 150});
      // });

      // Update prayer status using the enhanced hook with automatic sync
      const dateToUpdate = selectedDate || getTodayDateString(); // Use selectedDate if provided
      await updatePrayerStatus(
        dateToUpdate,
        prayerName.toLowerCase(),
        attendance,
      );

      // Call the parent onSelect callback for any additional UI updates
      onSelect(attendance);

      console.log(
        `✅ Prayer ${prayerName} attendance updated to: ${attendance}`,
      );
    } catch (error) {
      console.error('❌ Error updating prayer attendance:', error);
      // Still call parent callback in case of error
      onSelect(attendance);
    }
  }; // Render option as a simple button
  const renderOption = (option: any) => {
    const isSelected = currentAttendance === option.type;
    const isMasjid = option.type === 'mosque';
    const isNone = option.type === 'none';

    // Only show selection if there's a valid attendance value (not null or 'home')
    const hasValidSelection =
      currentAttendance !== null && currentAttendance !== 'home';
    const shouldShowAsSelected = hasValidSelection && isSelected;

    const getButtonStyle = () => {
      if (shouldShowAsSelected && isMasjid) {
        return [styles.optionButton, styles.selectedYesButton];
      } else if (shouldShowAsSelected && !isMasjid) {
        return [styles.optionButton, styles.selectedNoButton];
      } else {
        return [styles.optionButton, styles.unselectedButton];
      }
    };

    const getTextStyle = () => {
      if (shouldShowAsSelected && isMasjid) {
        return [styles.optionLabel, styles.selectedYesText];
      } else if (shouldShowAsSelected && !isMasjid) {
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
            shouldShowAsSelected && styles.selectedDescription,
          ]}>
          {option.description}
        </Text>
        {/* Show a cross symbol when "No" is selected */}
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
      statusBarTranslucent>
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

export default AttendanceSelectionModal;
