import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {colors} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  currentValue: number;
  title: string;
  isLoading: boolean;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  currentValue,
  title,
  isLoading,
}) => {
  const [tempValue, setTempValue] = useState(currentValue);

  React.useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue, visible]);

  const handleSave = async () => {
    try {
      await onSave(tempValue);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text) || 0;
    setTempValue(Math.max(0, num));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.countContainer}>
            <TextInput
              style={styles.countInput}
              value={tempValue.toString()}
              onChangeText={handleTextChange}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              textAlign="center"
              editable={!isLoading}
            />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}>
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  countContainer: {
    marginBottom: 24,
  },
  countInput: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.muted,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
  },
});

export default EditModal;
