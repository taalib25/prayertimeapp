import React from 'react';
import {View, Text, Button, StyleSheet, Alert, Vibration} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AndroidStyle,
  AndroidCategory,
} from '@notifee/react-native';

const CallScreen: React.FC = () => {
  // Internal function to schedule notification
  const scheduleFakeCallNotificationInternal = async (
    targetDate: Date,
    message: string,
  ) => {
    if (targetDate.getTime() <= Date.now()) {
      throw new Error('Please select a future time for the reminder.');
    }

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'fake-call-channel',
      name: 'Fake Call Channel',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibrationPattern: [300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true, // Bypass Do Not Disturb
    });

    // Create a trigger notification
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetDate.getTime(),
    } as const;

    // Display a notification
    await notifee.createTriggerNotification(
      {
        title: 'Incoming Call',
        body: message || 'Prayer Reminder',
        data: {
          screen: 'FakeCallScreen',
          message: message,
          launchTimestamp: Date.now(),
        },
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message || 'Prayer Reminder. Tap to answer.',
          },
          category: AndroidCategory.CALL,
          pressAction: {
            id: 'default',
            launchActivity: 'com.prayer_app.FakeCallActivity',
          },
          fullScreenAction: {
            id: 'full-screen',
            launchActivity: 'com.prayer_app.FakeCallActivity',
          },
          sound: 'ringtone',
          visibility: AndroidVisibility.PUBLIC,
          vibrationPattern: [300, 500, 300, 500],
          ongoing: true,
          autoCancel: false,
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: 'answer-call',
                launchActivity: 'com.prayer_app.FakeCallActivity',
              },
            },
            {
              title: 'Decline',
              pressAction: {
                id: 'decline-call',
              },
            },
          ],
        },
        ios: {
          sound: 'ringtone.caf',
          categoryId: 'reminder',
          interruptionLevel: 'timeSensitive',
          critical: true,
          criticalVolume: 1.0,
        },
      },
      trigger,
    );
  };

  // Quick test function for 1 minute timer
  const scheduleQuickTest = async () => {
    const testDate = new Date(Date.now() + 60000); // 1 minute from now

    try {
      await scheduleFakeCallNotificationInternal(
        testDate,
        'Test Prayer Reminder - This is a 1 minute test!',
      );

      // Add immediate vibration for feedback
      Vibration.vibrate([100, 200, 100]);

      Alert.alert(
        'Test Scheduled ✅',
        'Test fake call will trigger in 1 minute!\n\n🔒 Lock your phone now to test the full effect!\n📱 The call will appear even if phone is silent.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Test scheduled'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Could not schedule test reminder.');
    }
  };

  // Cancel all scheduled notifications
  const cancelAllNotifications = async () => {
    try {
      await notifee.cancelAllNotifications();
      Alert.alert(
        'Cancelled',
        'All scheduled fake call reminders have been cancelled.',
      );
    } catch (error) {
      Alert.alert('Error', 'Could not cancel notifications.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕌 Prayer Fake Call Setup</Text>
      <Text style={styles.subtitle}>
        Schedule a fake incoming call to remind you of prayer time
      </Text>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>⏰ Set Timer (1 Minute)</Text>
        <Button
          title="Start 1 Minute Test"
          onPress={scheduleQuickTest}
          color="#FF6B35"
        />
        <Text style={styles.testDescription}>
         Lock your phone after pressing this button.
        </Text>
      </View>

      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#1a5276',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testSection: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  testDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  controlSection: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default CallScreen;
