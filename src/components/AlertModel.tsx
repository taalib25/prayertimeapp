import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmDestructive = false,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
    statusBarTranslucent
  >
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirmDestructive && styles.destructiveButton,
            ]}
            onPress={onConfirm}
          >
            <Text
              style={[
                styles.confirmText,
                confirmDestructive && styles.destructiveText,
              ]}
            >
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text.dark,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.text.muted,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.button,
    color: colors.white,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    ...typography.button,
    color: colors.white,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  destructiveText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default AlertModal;