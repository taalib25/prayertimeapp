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

export type AttendanceType = 'home' | 'mosque' | 'none';

interface AttendanceSelectionModalProps {
  visible: boolean;
  currentAttendance: AttendanceType;
  onSelect: (attendance: AttendanceType) => void;
  onClose: () => void;
  prayerName: string;
  isUpdating?: boolean; // Add loading state prop
}

const AttendanceSelectionModal: React.FC<AttendanceSelectionModalProps> = ({
  visible,
  currentAttendance,
  onSelect,
  onClose,
  prayerName,
  isUpdating = false,
}) => {
  const handleSelect = (attendance: AttendanceType) => {
    if (isUpdating) {
      console.log('📱 Modal: Update in progress, ignoring selection');
      return;
    }

    console.log(`📱 Modal: User selected ${attendance} for ${prayerName}`);
    console.log(`📱 Modal: Current attendance was ${currentAttendance}`);

    // Call the parent's onSelect function
    onSelect(attendance);

    // Note: Don't close modal here, let parent handle it after successful update
  };

  // Debug log the modal state
  console.log(
    `🎭 Modal rendered: visible=${visible}, current=${currentAttendance}, prayer=${prayerName}`,
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.prayerTitle}>{prayerName}</Text>
            <Text style={styles.subtitle}>
              {isUpdating ? 'Updating...' : 'Update prayer status'}
            </Text>
          </View>
          {/* Options List */}
          <View style={styles.optionsContainer}>
            {/* Not Prayed Option */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                currentAttendance === 'none' && styles.optionSelected,
                isUpdating && styles.optionDisabled,
              ]}
              onPress={() => handleSelect('none')}
              activeOpacity={isUpdating ? 1 : 0.7}
              disabled={isUpdating}>
              <View style={[styles.statusCircle, styles.noneCircle]} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>Not Prayed</Text>
                <Text style={styles.optionDescription}>
                  Clear prayer status
                </Text>
              </View>
              {currentAttendance === 'none' && (
                <View style={styles.checkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* At Home Option */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                currentAttendance === 'home' && styles.optionSelected,
                isUpdating && styles.optionDisabled,
              ]}
              onPress={() => handleSelect('home')}
              activeOpacity={isUpdating ? 1 : 0.7}
              disabled={isUpdating}>
              <View style={[styles.statusCircle, styles.homeCircle]} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>At Home</Text>
                <Text style={styles.optionDescription}>
                  Prayed individually
                </Text>
              </View>
              {currentAttendance === 'home' && (
                <View style={styles.checkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* At Masjid Option */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                currentAttendance === 'mosque' && styles.optionSelected,
                isUpdating && styles.optionDisabled,
              ]}
              onPress={() => handleSelect('mosque')}
              activeOpacity={isUpdating ? 1 : 0.7}
              disabled={isUpdating}>
              <View style={[styles.statusCircle, styles.masjidCircle]} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>At Masjid</Text>
                <Text style={styles.optionDescription}>
                  Prayed in congregation
                </Text>
              </View>
              {currentAttendance === 'mosque' && (
                <View style={styles.checkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* Current Status Display */}
          <View style={styles.statusDisplay}>
            <Text style={styles.statusDisplayText}>
              Current:{' '}
              {currentAttendance === 'none'
                ? 'Not Prayed'
                : currentAttendance === 'home'
                ? 'At Home'
                : 'At Mosque'}
            </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
  optionDisabled: {
    opacity: 0.5,
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
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default AttendanceSelectionModal;
