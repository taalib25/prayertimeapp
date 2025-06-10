import React from 'react';
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

export type AttendanceType = 'home' | 'masjid' | 'none';

interface AttendanceOption {
  type: AttendanceType;
  label: string;
  color: string;
  opacity: number;
  description: string;
  icon: string;
}

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
  const attendanceOptions: AttendanceOption[] = [
    {
      type: 'none',
      label: 'Not Prayed',
      color: colors.text.muted,
      opacity: 0.4,
      description: 'Prayer not completed yet',
      icon: '',
    },
    {
      type: 'home',
      label: 'At Home',
      color: colors.success,
      opacity: 1,
      description: 'Prayed individually',
      icon: '',
    },
    {
      type: 'masjid',
      label: 'At Masjid',
      color: colors.text.prayerBlue,
      opacity: 1,
      description: 'Prayed in congregation',
      icon: '',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.prayerTitle}>{prayerName}</Text>
            <Text style={styles.subtitle}>Update prayer status</Text>
          </View>

          {/* Options List */}
          <View style={styles.optionsContainer}>
            {attendanceOptions.map(option => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.optionRow,
                  currentAttendance === option.type && styles.optionSelected,
                ]}
                onPress={() => {
                  onSelect(option.type);
                  onClose();
                }}
                activeOpacity={0.7}>
                {/* Status circle */}
                <View
                  style={[
                    styles.statusCircle,
                    {
                      backgroundColor: option.color,
                      opacity: option.opacity,
                    },
                  ]}
                />

                {/* Text */}
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>

                {/* Checkmark */}
                {currentAttendance === option.type && (
                  <View style={styles.checkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  header: {
    backgroundColor: colors.background.dark, // Dark blue header like in the screenshot
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  prayerTitle: {
    ...typography.h2,
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  optionsContainer: {
    paddingVertical: 8,
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
    backgroundColor: '#F8FAF8', // Very light green tint
  },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  optionLabel: {
    ...typography.bodyMedium,
    color: '#333333',
  },
  optionDescription: {
    ...typography.caption,
    color: '#666666', // Darker secondary text
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.prayerBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#333333', // Darker close button
    marginTop: 8,
    opacity: 0.8,
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  closeText: {
    ...typography.body,
    color: colors.text.primary,
  },
});

export default AttendanceSelectionModal;
