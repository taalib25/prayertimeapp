import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';

export type AttendanceType = 'home' | 'mosque' | 'none';

// Option configuration for cleaner rendering - Focus on Masjid and None
const ATTENDANCE_OPTIONS = [
  {
    type: 'mosque' as AttendanceType,
    label: 'At Masjid',
    description: 'Prayed in congregation',
    priority: 1, // Main focus option
  },
  {
    type: 'none' as AttendanceType,
    label: 'Not Prayed',
    description: 'Clear prayer status',
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
}

const AttendanceSelectionModal: React.FC<AttendanceSelectionModalProps> = ({
  visible,
  currentAttendance,
  onSelect,
  onClose,
  prayerName,
}) => {
  // Simple selection handler
  const handleSelect = (attendance: AttendanceType) => {
    onSelect(attendance);
  };

  // Get status display text
  // Render option row with enhanced styling for main focus
  const renderOption = (option: any) => {
    const isSelected = currentAttendance === option.type;
    const isMasjid = option.type === 'mosque'; // Get circle style based on type with enhanced focus for masjid
    const getCircleStyle = () => {
      switch (option.type) {
        case 'none':
          return [styles.statusCircle, styles.noneCircle];
        case 'home':
          return [styles.statusCircle, styles.homeCircle];
        case 'mosque':
          return [styles.statusCircle, styles.masjidCircle];
        default:
          return [styles.statusCircle, styles.noneCircle];
      }
    }; // Enhanced container styling for main focus
    const getContainerStyle = () => {
      if (isSelected) {
        return [styles.optionRow, styles.optionSelected];
      }
      return [styles.optionRow];
    };

    return (
      <TouchableOpacity
        key={option.type}
        style={getContainerStyle()}
        onPress={() => handleSelect(option.type)}
        activeOpacity={0.7}>
        <View style={getCircleStyle()} />
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionLabel,
              isMasjid && {color: '#16A34A', fontWeight: '700'}, // Enhanced styling for masjid
            ]}>
            {option.label}
          </Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
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
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.prayerTitle}>{prayerName}</Text>
            <Text style={styles.subtitle}>Update prayer status</Text>
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
        </Pressable>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  prayerTitle: {
    ...typography.h3,
    fontSize: 26,
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  optionsContainer: {
    paddingVertical: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#F8FAF8',
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 16,
  },
  noneCircle: {
    backgroundColor: '#E0E0E0',
  },
  homeCircle: {
    backgroundColor: '#4DABF7',
  },
  masjidCircle: {
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.primary, // Enhanced border for focus
    transform: [{scale: 1.1}], // Slightly larger for emphasis
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  optionLabel: {
    ...typography.bodyMedium,
    color: '#333333',
    marginBottom: 2,
  },
  optionDescription: {
    ...typography.bodyTiny,
    color: '#666666',
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
});

export default AttendanceSelectionModal;
