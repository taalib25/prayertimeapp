import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'excused' | 'absent';
  member_username: string;
  location?: string;
}

interface MeetingStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (status: 'completed' | 'excused' | 'absent', note: string) => void;
  member: MeetingMember;
}

const STATUS_OPTIONS = [
  {
    type: 'completed' as const,
    label: 'Completed',
    description: 'Meeting was completed successfully',
    icon: 'attended',
    color: '#20B83F',
  },
  {
    type: 'excused' as const,
    label: 'Excused',
    description: 'Member was excused from meeting',
    icon: 'assigned',
    color: '#F57C00',
  },
  {
    type: 'absent' as const,
    label: 'Absent',
    description: 'Member did not attend',
    icon: 'absent',
    color: '#FF2626',
  },
];

const MeetingStatusModal: React.FC<MeetingStatusModalProps> = ({
  visible,
  onClose,
  onSave,
  member,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<
    'completed' | 'excused' | 'absent' | null
  >(null);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (selectedStatus) {
      onSave(selectedStatus, note);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setNote('');
    onClose();
  };

  const handleStatusSelect = (status: 'completed' | 'excused' | 'absent') => {
    setSelectedStatus(status);
  };

  const renderStatusOption = (option: (typeof STATUS_OPTIONS)[0]) => {
    const isSelected = selectedStatus === option.type;

    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.statusOption,
          isSelected && {
            backgroundColor: option.color + '20', // 20% opacity for lighter color
            borderColor: option.color,
            borderWidth: 2,
          },
        ]}
        onPress={() => handleStatusSelect(option.type)}
        activeOpacity={0.8}>
        <SvgIcon
          name={option.icon as any}
          size={24}
          color={isSelected ? option.color : colors.text.muted}
        />
        <Text
          style={[
            styles.statusLabel,
            {color: isSelected ? option.color : colors.text.muted},
          ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            style={styles.container}
            onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Meeting Status</Text>
              <Text style={styles.memberName}>{member.member_name}</Text>
            </View>

            {/* Status Options in Row */}
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(renderStatusOption)}
            </View>

            {/* Meeting Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Meeting Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes about the meeting..."
                placeholderTextColor={colors.text.muted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !selectedStatus && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={!selectedStatus}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
  },
  title: {
    ...typography.h2,
    color: colors.text.dark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  memberName: {
    ...typography.bodyLarge,
    color: colors.text.muted,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'space-around',
  },
  statusOption: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.background.dark,
    backgroundColor: colors.background.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  notesSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  notesLabel: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.light,
    ...typography.bodyMedium,
    color: colors.text.dark,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.background.light,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});

export default MeetingStatusModal;
