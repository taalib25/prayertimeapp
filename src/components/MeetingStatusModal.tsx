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
  TouchableWithoutFeedback,
  Keyboard,
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
  session_notes?: string; // Add session notes
  pre_session_notes?: string; // Add pre-session notes
}

interface MeetingStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (status: 'completed' | 'excused' | 'absent', note: string) => void;
  member: MeetingMember;
  isLoading?: boolean; // Add loading prop
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
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<
    'completed' | 'excused' | 'absent' | null
  >(null);
  const [note, setNote] = useState('');

  // Initialize with existing data when modal opens
  React.useEffect(() => {
    if (visible && member) {
      // Set current status if it's not 'scheduled'
      if (member.status !== 'scheduled') {
        setSelectedStatus(member.status as 'completed' | 'excused' | 'absent');
      } else {
        setSelectedStatus(null);
      }

      // Set existing session notes
      setNote(member.session_notes || '');
    }
  }, [visible, member]);

  const handleSave = () => {
    if (selectedStatus) {
      onSave(selectedStatus, note);
      // Don't reset state here - let parent handle it
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <Pressable style={styles.overlay} onPress={handleClose}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Pressable
                style={styles.container}
                onPress={e => e.stopPropagation()}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Meeting Status</Text>
                  <Text style={styles.memberName}>{member.member_name}</Text>
                </View>

                {/* Meeting Info Section */}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.member_name}</Text>
                  <Text style={styles.meetingDetails}>
                    {new Date(member.scheduled_date).toLocaleDateString()} at{' '}
                    {formatTimeDisplay(member.scheduled_time)}
                  </Text>
                  {member.location && (
                    <Text style={styles.locationText}>{member.location}</Text>
                  )}
                  {member.pre_session_notes && (
                    <View style={styles.preNotesSection}>
                      <Text style={styles.preNotesLabel}>
                        Pre-session Notes:
                      </Text>
                      <Text style={styles.preNotesText}>
                        {member.pre_session_notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status Options in Row */}
                <View style={styles.statusRow}>
                  {STATUS_OPTIONS.map(renderStatusOption)}
                </View>

                {/* Meeting Notes */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>
                    Session Notes{' '}
                    {selectedStatus === 'completed'
                      ? '(Required)'
                      : '(Optional)'}
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      selectedStatus === 'completed' &&
                        !note.trim() &&
                        styles.requiredField,
                    ]}
                    placeholder={
                      selectedStatus === 'completed'
                        ? 'Please add notes about the completed session...'
                        : 'Add any notes about the meeting...'
                    }
                    placeholderTextColor={colors.text.muted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isLoading}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleClose}
                    disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!selectedStatus ||
                        isLoading ||
                        (selectedStatus === 'completed' && !note.trim())) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={
                      !selectedStatus ||
                      isLoading ||
                      (selectedStatus === 'completed' && !note.trim())
                    }>
                    <Text style={styles.saveButtonText}>
                      {isLoading ? 'Saving...' : 'Save Status'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </TouchableWithoutFeedback>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  memberInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
  },
  meetingDetails: {
    ...typography.bodyMedium,
    color: colors.text.muted,
    marginTop: spacing.xs / 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs / 2,
  },
  preNotesSection: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.light,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  preNotesLabel: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  preNotesText: {
    ...typography.caption,
    color: colors.text.dark,
    fontStyle: 'italic',
  },
  requiredField: {
    borderColor: colors.error,
    borderWidth: 1,
  },
});

// Helper function for time formatting (add this at the top if not already present)
const formatTimeDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

export default MeetingStatusModal;
