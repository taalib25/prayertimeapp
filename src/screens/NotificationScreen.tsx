import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import MeetingCard from '../components/MeetingCard';
import UnifiedNotificationService from '../services/UnifiedNotificationService';
import {useAuth} from '../contexts/AuthContext';

const NotificationScreen: React.FC = () => {
  const {logout} = useAuth();
  // Sample data for the meeting cards
  const personalizedMeeting = {
    title: 'Personalized Meeting',
    subtitle: '3 Days Remaining',
    persons: [
      {name: 'Ahmed Al-Rashid', phone: '07712345698', completed: false},
      {name: 'Hassan Ibrahim', phone: '07712345699', completed: true},
      {name: 'Omar Abdullah  ', phone: '07712345700', completed: false},
    ],
    stats: [
      {label: 'Assigned', value: '3'},
      {label: 'Completed', value: '1'},
      {label: 'Remaining', value: '2'},
    ],
  };

  const meetingAttendance = {
    title: 'Meeting Attendance',
    subtitle: 'Last 5 meetings',
    stats: [
      {label: 'Attended', value: '4'},
      {label: 'Absent', value: '1'},
      {label: 'Excused', value: '2'},
    ],
  };

  const handlePersonPress = (person: any, index: number) => {
    console.log(`Pressed person ${index + 1}: ${person.phone}`);
  };

  // Test fake call notification (fullscreen)
  const testFakeCallNotification = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.scheduleTestFakeCall(1001, 5);
      Alert.alert(
        'Fake Call Scheduled ✅',
        'Fake call notification will appear in 5 seconds and should bypass DND/Silent mode!',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule fake call notification');
    }
  };

  // Test prayer notifications for today
  const testPrayerNotifications = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.scheduleTodayPrayerNotifications(1001);

      Alert.alert(
        'Prayer Notifications Scheduled ✅',
        'Prayer notifications have been scheduled for today based on your settings!',
      );
    } catch (error: any) {
      console.error('Prayer notifications error:', error);
      Alert.alert(
        'Error',
        `Failed to schedule prayer notifications: ${error?.message || error}`,
      );
    }
  };

  // Test simple notification
  const testSimpleNotification = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();

      const result = await notificationService.scheduleTestNotification(
        1001,
        5,
      );

      if (result) {
        Alert.alert(
          'Test Notification Scheduled ✅',
          'A test notification will appear in 5 seconds!',
        );
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
      Alert.alert(
        'Error',
        `Failed to schedule test notification: ${error?.message || error}`,
      );
    }
  };

  // Replace scheduleWeeklyPrayers function with this:
  const initializeDailyPrayers = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.scheduleDailyPrayerNotifications(1001);

      Alert.alert(
        'Daily Prayer Notifications Set ✅',
        'Prayer notifications are now scheduled with daily repeat. They will automatically update when prayer times change!',
      );
    } catch (error: any) {
      console.error('Daily prayer notifications error:', error);
      Alert.alert(
        'Error',
        `Failed to setup daily prayers: ${error?.message || error}`,
      );
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
            style={[styles.testButton, styles.standardButton]}
            onPress={testSimpleNotification}>
            <Text style={styles.testButtonText}>Try Simple Notification</Text>
            <Text style={styles.testButtonSubtext}>
              Standard notification in 5 seconds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.testButton, styles.fakeCallButton]}
            onPress={testFakeCallNotification}>
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

        <Pressable
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: logout,
              },
            ])
          }>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

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
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logoutText: {
    ...typography.button,
    color: colors.white,
  },
  bottomSpacing: {
    marginBottom: 80,
    height: spacing.xxl,
  },
});

export default NotificationScreen;
