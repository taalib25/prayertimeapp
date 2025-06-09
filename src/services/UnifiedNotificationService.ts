import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';
import UserPreferencesService from './UserPreferencesService';
import {getPrayerTimesForDate} from './db/PrayerServices';

interface ScheduledNotification {
  id: string;
  uid: number;
  prayer: string;
  timestamp: number;
  type: 'standard' | 'fullscreen';
}

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private preferencesService = UserPreferencesService.getInstance();
  private standardChannelId = 'prayer-notifications-standard';
  private fullscreenChannelId = 'prayer-notifications-fullscreen';

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Create standard notification channel
      await notifee.createChannel({
        id: this.standardChannelId,
        name: 'Prayer Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Create fullscreen notification channel for fake call style
      await notifee.createChannel({
        id: this.fullscreenChannelId,
        name: 'Prayer Alarms',
        importance: AndroidImportance.HIGH,
        sound: 'ringtone',
        vibration: true,
        visibility: AndroidVisibility.PUBLIC,
        bypassDnd: true,
      });

      console.log('✅ Notification channels initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification channels:', error);
      throw error;
    }
  }

  /**
   * Main method to schedule all prayer notifications for a user
   */
  async scheduleDailyPrayerNotifications(
    uid: number,
    date: string,
  ): Promise<void> {
    try {
      if (!uid || !date) {
        throw new Error('Invalid uid or date provided');
      }

      await this.initialize();

      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );
      if (!settings || !settings.notifications) {
        console.log(`❌ Notifications disabled for user ${uid}`);
        return;
      }

      const prayerTimes = await getPrayerTimesForDate(date);
      if (!prayerTimes) {
        console.log(`❌ No prayer times found for ${date}`);
        return;
      }

      // Clear existing notifications first
      await this.clearUserNotifications(uid);

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const notifications: ScheduledNotification[] = [];

      for (const prayer of prayers) {
        try {
          if (
            !settings.prayer_specific ||
            !settings.prayer_specific[
              prayer as keyof typeof settings.prayer_specific
            ]
          ) {
            continue;
          }

          const prayerTime = prayerTimes[
            prayer as keyof typeof prayerTimes
          ] as string;
          if (!prayerTime) continue;

          const notificationTime = this.calculateNotificationTime(
            prayerTime,
            settings.reminder_minutes_before || 10,
          );

          // Only schedule future notifications
          if (notificationTime > new Date()) {
            // Schedule standard notification if enabled
            if (settings.notification_types?.standard) {
              const standardId = await this.scheduleStandardNotification(
                uid,
                prayer,
                notificationTime,
                settings,
              );
              if (standardId) {
                notifications.push({
                  id: standardId,
                  uid,
                  prayer,
                  timestamp: notificationTime.getTime(),
                  type: 'standard',
                });
              }
            }

            // Schedule fullscreen notification if enabled
            if (settings.notification_types?.fullscreen) {
              const fullscreenId = await this.scheduleFullscreenNotification(
                uid,
                prayer,
                notificationTime,
                settings,
              );
              if (fullscreenId) {
                notifications.push({
                  id: fullscreenId,
                  uid,
                  prayer,
                  timestamp: notificationTime.getTime(),
                  type: 'fullscreen',
                });
              }
            }
          }
        } catch (prayerError) {
          console.error(
            `❌ Failed to schedule ${prayer} notification:`,
            prayerError,
          );
          // Continue with other prayers even if one fails
        }
      }

      console.log(
        `✅ Scheduled ${notifications.length} notifications for user ${uid} on ${date}`,
      );
    } catch (error) {
      console.error('❌ Failed to schedule daily prayer notifications:', error);
      throw error;
    }
  }

  private async scheduleStandardNotification(
    uid: number,
    prayer: string,
    notificationTime: Date,
    settings: any,
  ): Promise<string | null> {
    try {
      const id = `prayer-${uid}-${prayer}-standard-${notificationTime.getTime()}`;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: `${this.capitalizePrayer(prayer)} Prayer`,
          body: `It's almost time for ${prayer} prayer`,
          data: {
            type: 'prayer-reminder',
            uid: uid.toString(),
            prayer,
          },
          android: {
            channelId: this.standardChannelId,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.REMINDER,
            pressAction: {id: 'default'},
            sound: settings.notification_types?.sound
              ? settings.adhan_sound
              : undefined,
            vibrationPattern: settings.notification_types?.vibration
              ? [300, 500, 300, 400]
              : undefined,
          },
          ios: {
            sound: settings.notification_types?.sound
              ? `${settings.adhan_sound}.caf`
              : undefined,
          },
        },
        trigger,
      );

      return id;
    } catch (error) {
      console.error(
        `❌ Failed to schedule standard notification for ${prayer}:`,
        error,
      );
      return null;
    }
  }

  private async scheduleFullscreenNotification(
    uid: number,
    prayer: string,
    notificationTime: Date,
    settings: any,
  ): Promise<string | null> {
    try {
      // Generate unique ID
      const id = `prayer-fullscreen-${prayer}-${uid}-${notificationTime.getTime()}`;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: 'Prayer Time ☪️',
          body: `${this.capitalizePrayer(prayer)} Prayer Reminder`,
          data: {
            type: 'fake-call',
            uid: uid.toString(),
            prayer,
            screen: 'FakeCallScreen',
            notificationId: id,
            returnTo: 'MainApp',
          },
          android: {
            channelId: this.fullscreenChannelId,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            visibility: settings.dnd_bypass
              ? AndroidVisibility.PUBLIC
              : AndroidVisibility.PRIVATE,
            pressAction: {
              id: 'default',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            fullScreenAction: {
              id: 'full-screen',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            sound: 'ringtone',
            vibrationPattern: [300, 500, 300, 500],
            ongoing: false,
            autoCancel: true,
            lightUpScreen: true,
            onlyAlertOnce: false,
            timeoutAfter: 30000,
            smallIcon: 'ic_notification',
            localOnly: true,
          },
          ios: {
            sound: 'ringtone.caf',
            critical: settings.dnd_bypass,
            criticalVolume: settings.dnd_bypass ? 1.0 : 0.7,
          },
        },
        trigger,
      );

      console.log(
        `✅ Scheduled fullscreen notification for ${prayer} at ${notificationTime.toLocaleString()}`,
      );
      return id;
    } catch (error) {
      console.error('❌ Error scheduling fullscreen notification:', error);
      return null;
    }
  }

  private calculateNotificationTime(
    prayerTime: string,
    minutesBefore: number,
  ): Date {
    try {
      if (!prayerTime || typeof prayerTime !== 'string') {
        throw new Error('Invalid prayer time format');
      }

      const [hours, minutes] = prayerTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format');
      }

      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes - (minutesBefore || 10), 0, 0);

      // If time has passed today, schedule for tomorrow
      if (notificationTime <= new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      return notificationTime;
    } catch (error) {
      console.error('❌ Failed to calculate notification time:', error);
      // Return a default time (current time + 1 hour)
      return new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  private async clearUserNotifications(uid: number): Promise<void> {
    try {
      const scheduled = await notifee.getTriggerNotifications();
      const userNotifications = scheduled.filter(
        n => n.notification.data?.uid === uid.toString(),
      );

      for (const notification of userNotifications) {
        try {
          if (notification.notification.id) {
            await notifee.cancelTriggerNotification(
              notification.notification.id,
            );
          }
        } catch (cancelError) {
          console.error('❌ Failed to cancel notification:', cancelError);
          // Continue with other notifications
        }
      }

      console.log(
        `🧹 Cleared ${userNotifications.length} existing notifications for user ${uid}`,
      );
    } catch (error) {
      console.error('❌ Failed to clear user notifications:', error);
      // Don't throw here, just log the error
    }
  }

  private capitalizePrayer(prayer: string): string {
    return prayer.charAt(0).toUpperCase() + prayer.slice(1);
  }

  /**
   * Quick method to schedule a test notification
   */
  async scheduleTestNotification(
    uid: number,
    delaySeconds: number = 20,
  ): Promise<void> {
    try {
      await this.initialize();

      const testTime = new Date(Date.now() + delaySeconds * 1000);
      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );

      if (!settings) {
        throw new Error('Unable to get notification settings');
      }

      await this.scheduleStandardNotification(uid, 'test', testTime, settings);

      if (settings.notification_types?.fullscreen) {
        await this.scheduleFullscreenNotification(
          uid,
          'test',
          testTime,
          settings,
        );
      }

      console.log(`🧪 Test notification scheduled for ${delaySeconds} seconds`);
    } catch (error) {
      console.error('❌ Failed to schedule test notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a test fake call notification
   */
  async scheduleTestFakeCall(
    uid: number,
    delaySeconds: number = 10,
  ): Promise<void> {
    try {
      await this.initialize();

      const testTime = new Date(Date.now() + delaySeconds * 1000);
      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );

      if (!settings) {
        throw new Error('Unable to get notification settings');
      }

      const id = `test-fake-call-${Date.now()}`;

      await notifee.createTriggerNotification(
        {
          id,
          title: 'Incoming Call 📞',
          body: 'Prayer Reminder Call',
          data: {
            type: 'fake-call',
            uid: uid.toString(),
            prayer: 'test-fake-call',
            screen: 'FakeCallScreen',
            notificationId: id,
            returnTo: 'MainApp',
          },
          android: {
            channelId: this.fullscreenChannelId,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: {
              id: 'default',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            fullScreenAction: {
              id: 'full-screen',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            sound: 'ringtone',
            vibrationPattern: [300, 500, 300, 500],
            ongoing: false,
            autoCancel: true,
            lightUpScreen: true,
            onlyAlertOnce: false,
            timeoutAfter: 30000,
            localOnly: true,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: testTime.getTime(),
        },
      );

      console.log(
        `🧪 Test fake call scheduled for ${delaySeconds} seconds with ID: ${id}`,
      );
    } catch (error) {
      console.error('❌ Failed to schedule test fake call:', error);
      throw error;
    }
  }
}

export default UnifiedNotificationService;
