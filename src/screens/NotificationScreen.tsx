import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import UnifiedNotificationService from '../services/CallerServices';
import NotificationService from '../services/notifications/notificationServices';
const NotificationScreen: React.FC = () => {
  const triggerTestNotification = async () => {
    try {
      await NotificationService.testNotificationIn5Seconds();
      // Or use the simpler version:
      // await NotificationService.scheduleSimpleTestNotification();

      Alert.alert(
        'Test Scheduled ✅',
        'A test notification will appear in 5 seconds!',
      );
    } catch (error) {
      Alert.alert('Error ❌', 'Failed to schedule test notification');
      console.error(error);
    }
  };

  // Sample data for the meeting cards with enhanced icons support
  const notificationService = UnifiedNotificationService.getInstance();

  // Test fake call notification (fullscreen)
  const callNotification = async () => {
    try {
      await notificationService.scheduleTestFakeCall();
      Alert.alert(
        'Fake Call Scheduled ✅',
        'Fake call notification will appear in 5 seconds and should bypass DND/Silent mode!',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule fake call notification');
    }
  };

  // View scheduled notifications
  const viewScheduledNotifications = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      const scheduled = await notificationService.getScheduledNotifications();

      const message =
        scheduled.length > 0
          ? `Found ${scheduled.length} scheduled notifications:\n\n${scheduled
              .map(
                (n: any) =>
                  `• ${n.notification.title} at ${
                    'timestamp' in n.trigger
                      ? new Date(n.trigger.timestamp).toLocaleString()
                      : 'Scheduled'
                  }`,
              )
              .join('\n')}`
          : 'No scheduled notifications found';

      Alert.alert('Scheduled Notifications', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to get scheduled notifications');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.cancelAllNotifications();
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Testing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notification Testing</Text>
          {/* <TouchableOpacity
            style={[styles.testButton, styles.standardButton]}
            onPress={initializeDailyPrayers}>
            <Text style={styles.testButtonText}>Setup Daily Prayers</Text>
            <Text style={styles.testButtonSubtext}>
              Smart daily repeating notifications
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={triggerTestNotification}
            activeOpacity={0.7}>
            <Text style={styles.testButtonText}>🧪 Test Notification (5s)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.testButton, styles.fakeCallButton]}
            onPress={callNotification}>
            <Text style={styles.testButtonText}>Try Fake Call</Text>
            <Text style={styles.testButtonSubtext}>
              Fake call notification in 5 seconds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.testButton, styles.infoButton]}
            onPress={viewScheduledNotifications}>
            <Text style={styles.testButtonText}>View Notifications</Text>
            <Text style={styles.testButtonSubtext}>
              See all scheduled notifications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.testButton, styles.clearButton]}
            onPress={clearAllNotifications}>
            <Text style={styles.testButtonText}>Clear All</Text>
            <Text style={styles.testButtonSubtext}>
              Cancel all notifications
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  testButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  standardButton: {
    backgroundColor: colors.primary,
  },
  fakeCallButton: {
    backgroundColor: '#FF6B35', // Orange color for fake call
  },
  infoButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  testButtonText: {
    ...typography.button,
    color: colors.white,
    marginBottom: 4,
  },
  testButtonSubtext: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  bottomSpacing: {
    marginBottom: 80,
    height: spacing.xxl,
  },
});

export default NotificationScreen;
