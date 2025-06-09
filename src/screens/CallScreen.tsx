import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
  TouchableOpacity,
} from 'react-native';
import notifee from '@notifee/react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import UnifiedNotificationService from '../services/UnifiedNotificationService';

const CallScreen: React.FC = () => {
  // Quick test function for 20 second timer
  const scheduleQuickTest = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.scheduleTestNotification(1, 20); // uid=1, 20 seconds

      // Add immediate vibration for feedback
      Vibration.vibrate([100, 200, 100]);

      Alert.alert(
        'Test Scheduled ✅',
        'Test notifications will appear in 20 seconds!',
      );
    } catch (error) {
      Alert.alert('Error', 'Could not schedule test reminder.');
    }
  };

  // Cancel all scheduled notifications
  const cancelAllNotifications = async () => {
    try {
      await notifee.cancelAllNotifications();
      Alert.alert('All scheduled calls cancelled');
    } catch (error) {
      Alert.alert('Error', 'Could not cancel notifications.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prayer Reminder Call</Text>
      <Text style={styles.subtitle}>Test the unified notification system</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={scheduleQuickTest}>
          <Text style={styles.buttonText}>Test Notifications (20s)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={cancelAllNotifications}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Cancel All
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.light,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
});

export default CallScreen;
