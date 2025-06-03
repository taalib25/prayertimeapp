import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AndroidStyle,
  AndroidCategory,
} from '@notifee/react-native';
import BackgroundFetch from 'react-native-background-fetch';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';

const CallScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Initialize BackgroundFetch for DND bypass
    const initBackgroundFetch = async () => {
      try {
        const status = await BackgroundFetch.configure(
          {
            minimumFetchInterval: 15, // 15 minutes minimum
            stopOnTerminate: false, // Continue after app termination
            startOnBoot: true, // Start on device boot
            enableHeadless: true, // Enable headless mode for Android
            forceAlarmManager: true, // Use AlarmManager for better reliability
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // No network required
          },
          async taskId => {
            console.log('[BackgroundFetch] Event received:', taskId);

            // Check if we have a scheduled fake call
            const scheduledCall = await checkScheduledCall();
            if (scheduledCall && scheduledCall) {
              // Navigate to fake call screen - this will now work with the updated type definition
              navigation.navigate('FakeCallScreen'); // Temporary type assertion to avoid issues
            }

            BackgroundFetch.finish(taskId);
          },
          taskId => {
            console.log('[BackgroundFetch] TIMEOUT:', taskId);
            BackgroundFetch.finish(taskId);
          },
        );

        console.log('[BackgroundFetch] configure status:', status);
      } catch (error) {
        console.error('[BackgroundFetch] configure error:', error);
      }
    };

    initBackgroundFetch();
  }, [navigation]);

  // Check if we have a scheduled call that should trigger
  const checkScheduledCall = async () => {
    // This would check your stored scheduled call time
    // For now, return null - implement your scheduling logic here
    return null;
  };

  // Internal function to schedule notification with BackgroundFetch fallback
  const scheduleFakeCallNotificationInternal = async (
    targetDate: Date,
    message: string,
  ) => {
    if (targetDate.getTime() <= Date.now()) {
      throw new Error('Please select a future time for the reminder.');
    }

    // For Android: Use both BackgroundFetch and notifications for maximum reliability
    if (Platform.OS === 'android') {
      // Schedule a custom task for precise timing
      const timeUntilCall = targetDate.getTime() - Date.now();
      const taskId = `fake-call-${Date.now()}`;

      // Store the scheduled call info for BackgroundFetch to check
      await storeScheduledCall(targetDate, message);

      // Schedule BackgroundFetch task
      await BackgroundFetch.scheduleTask({
        taskId: taskId,
        delay: timeUntilCall,
        periodic: false,
        forceAlarmManager: true,
      });

      // ALSO create a high-priority notification as backup
      const channelId = await notifee.createChannel({
        id: 'fake-call-channel',
        name: 'Fake Call Channel',
        importance: AndroidImportance.HIGH,
        sound: 'ringtone',
        vibrationPattern: [300, 500, 300, 500],
        visibility: AndroidVisibility.PUBLIC,
        bypassDnd: true,
      });

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: targetDate.getTime(),
      } as const;

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
        },
        trigger,
      );

      return;
    }

    // For iOS: Use critical notifications
    const channelId = await notifee.createChannel({
      id: 'fake-call-channel',
      name: 'Fake Call Channel',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibrationPattern: [300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true,
    });

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetDate.getTime(),
    } as const;

    await notifee.createTriggerNotification(
      {
        title: 'Incoming Call',
        body: message || 'Prayer Reminder',
        data: {
          screen: 'FakeCallScreen',
          message: message,
          launchTimestamp: Date.now(),
        },
        ios: {
          sound: 'ringtone.caf',
          categoryId: 'reminder',
          interruptionLevel: 'critical',
          critical: true,
          criticalVolume: 1.0,
        },
      },
      trigger,
    );
  };

  // Store scheduled call info for BackgroundFetch to check
  const storeScheduledCall = async (targetDate: Date, message: string) => {
    // Store in AsyncStorage or your preferred storage
    const scheduledCall = {
      timestamp: targetDate.getTime(),
      message: message,
      created: Date.now(),
    };
    // Implementation depends on your storage solution
  };

  // Quick test function for 20 second timer
  const scheduleQuickTest = async () => {
    const testDate = new Date(Date.now() + 20000); // 20 seconds from now

    try {
      await scheduleFakeCallNotificationInternal(
        testDate,
        'Test Prayer Reminder - This is a 20 second test!',
      );

      // Add immediate vibration for feedback
      Vibration.vibrate([100, 200, 100]);

      const platformMessage =
        Platform.OS === 'android'
          ? 'Test fake call will appear in 20 seconds!'
          : 'Test fake call will trigger in 20 seconds! Lock your phone to test the full effect.';

      Alert.alert('Test Scheduled ✅', platformMessage);
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
      <Text style={styles.subtitle}>
        Schedule a fake incoming call for prayer times
      </Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={scheduleQuickTest}>
          <Text style={styles.buttonText}>Start 20 Second Test Call</Text>
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
