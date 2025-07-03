import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'excused';
  member_username: string;
  location?: string;
}

interface MeetingStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (status: 'completed' | 'cancelled', note: string) => void;
  member: MeetingMember;
}

const MeetingStatusModal: React.FC<MeetingStatusModalProps> = ({
  visible,
  onClose,
  onSave,
  member,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<
    'completed' | 'cancelled' | null
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

  const handleStatusSelect = (status: 'completed' | 'cancelled') => {
    setSelectedStatus(status);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}>
            <View style={styles.modalContainer}>
              <TouchableOpacity activeOpacity={1} style={styles.contentContainer}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Mark Meeting Status</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}>
                <View style={styles.statusSection}>
                  <Text style={styles.sectionTitle}>Meeting Status</Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        selectedStatus === 'completed' &&
                          styles.selectedCompletedOption,
                      ]}
                      onPress={() => handleStatusSelect('completed')}>
                      <SvgIcon
                        name="attended"
                        size={20}
                        color={
                          selectedStatus === 'completed' ? '#fff' : '#20B83F'
                        }
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          selectedStatus === 'completed' &&
                            styles.selectedStatusText,
                        ]}>
                        Completed
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        selectedStatus === 'cancelled' &&
                          styles.selectedCancelledOption,
                      ]}
                      onPress={() => handleStatusSelect('cancelled')}>
                      <SvgIcon
                        name="absent"
                        size={20}
                        color={
                          selectedStatus === 'cancelled' ? '#fff' : '#FF2626'
                        }
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          selectedStatus === 'cancelled' &&
                            styles.selectedStatusText,
                        ]}>
                        Cancelled
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.sectionTitle}>Meeting Notes</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add any additional notes about the meeting..."
                    placeholderTextColor={colors.text.muted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
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
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.prayerBlue,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.text.muted,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statusSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    color: colors.text.dark,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.background.light,
    backgroundColor: colors.white,
  },
  selectedCompletedOption: {
    backgroundColor: '#20B83F',
    borderColor: '#20B83F',
  },
  selectedCancelledOption: {
    backgroundColor: '#FF2626',
    borderColor: '#FF2626',
  },
  statusOptionText: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  selectedStatusText: {
    color: colors.white,
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.light,
    ...typography.bodyMedium,
    color: colors.text.dark,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.light,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
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
    fontWeight: '600',
  },
});

export default MeetingStatusModal;
