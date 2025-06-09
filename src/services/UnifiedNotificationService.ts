import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import UserPreferencesService from './UserPreferencesService';
import {getPrayerTimesForDate} from './db/PrayerServices';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private preferencesService: UserPreferencesService;
  private standardChannelId = 'prayer-notifications-standard';
  private fullscreenChannelId = 'prayer-notifications-fullscreen';
  private isInitialized = false;

  private constructor() {
    this.preferencesService = UserPreferencesService.getInstance();
  }

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📱 Notification service already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing notification service...');

      // Request permission
      await notifee.requestPermission();

      if (Platform.OS === 'android') {
        // Create standard notification channel
        await notifee.createChannel({
          id: this.standardChannelId,
          name: 'Prayer Notifications',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          sound: 'adhan',
          vibration: true,
          description: 'Prayer time reminders',
        });

        // Create fullscreen notification channel (fake call)
        await notifee.createChannel({
          id: this.fullscreenChannelId,
          name: 'Prayer Call Notifications',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          sound: 'ringtone',
          vibration: true,
          description: 'Full-screen prayer call notifications',
        });
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      throw error;
    }
  }

  async scheduleDailyPrayerNotifications(
    uid: number,
    date: string,
  ): Promise<void> {
    try {
      console.log(`🔔 Scheduling prayer notifications for ${date}...`);

      // Get user notification settings
      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );
      if (!settings?.notifications) {
        console.log('❌ Notifications disabled for user');
        return;
      }

      // Get prayer times for the date
      const prayerTimes = await getPrayerTimesForDate(date);
      if (!prayerTimes) {
        console.log(`❌ No prayer times found for ${date}`);
        return;
      }

      // Cancel existing notifications for this date
      await this.cancelPrayerNotificationsForDate(date);

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      let scheduledCount = 0;

      for (const prayer of prayers) {
        // Check if this prayer is enabled
        if (
          !settings.prayer_specific[
            prayer as keyof typeof settings.prayer_specific
          ]
        ) {
          console.log(`⏭️ Skipping ${prayer} - disabled in settings`);
          continue;
        }

        const prayerTime = prayerTimes[
          prayer as keyof typeof prayerTimes
        ] as string;
        if (!prayerTime) {
          console.log(`⏭️ Skipping ${prayer} - no time found`);
          continue;
        }

        // Calculate notification time
        const notificationTime = this.calculateNotificationTime(
          date,
          prayerTime,
          settings.reminder_minutes_before || 10,
        );

        if (notificationTime <= new Date()) {
          console.log(`⏭️ Skipping ${prayer} - time already passed`);
          continue;
        }

        // Schedule standard notification if enabled
        if (settings.notification_types.standard) {
          await this.scheduleStandardNotification(
            uid,
            prayer,
            notificationTime,
            settings,
          );
          scheduledCount++;
        }

        // Schedule fullscreen notification if enabled
        if (settings.notification_types.fullscreen) {
          await this.scheduleFullscreenNotification(
            uid,
            prayer,
            notificationTime,
            settings,
          );
          scheduledCount++;
        }
      }

      console.log(
        `✅ Scheduled ${scheduledCount} prayer notifications for ${date}`,
      );
    } catch (error) {
      console.error('❌ Error scheduling prayer notifications:', error);
      throw error;
    }
  }

  private calculateNotificationTime(
    date: string,
    prayerTime: string,
    minutesBefore: number,
  ): Date {
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const notificationDate = new Date(`${date}T${prayerTime}:00`);
    notificationDate.setMinutes(notificationDate.getMinutes() - minutesBefore);
    return notificationDate;
  }

  private async scheduleStandardNotification(
    uid: number,
    prayer: string,
    notificationTime: Date,
    settings: any,
  ): Promise<string | null> {
    try {
      const id = `prayer-standard-${prayer}-${uid}-${notificationTime.getTime()}`;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: 'Prayer Time 🕌',
          body: `${this.capitalizePrayer(prayer)} prayer time is approaching`,
          data: {
            type: 'prayer-reminder',
            uid: uid.toString(),
            prayer,
            notificationId: id,
          },
          android: {
            channelId: this.standardChannelId,
            importance: AndroidImportance.HIGH,
            visibility: settings.dnd_bypass
              ? AndroidVisibility.PUBLIC
              : AndroidVisibility.PRIVATE,
            sound: settings.notification_types.sound
              ? settings.adhan_sound || 'adhan'
              : undefined,
            vibrationPattern: settings.notification_types.vibration
              ? [300, 500, 300, 500]
              : undefined,
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: settings.notification_types.sound
              ? `${settings.adhan_sound || 'adhan'}.caf`
              : undefined,
            critical: settings.dnd_bypass,
            criticalVolume: settings.dnd_bypass ? 1.0 : 0.7,
          },
        },
        trigger,
      );

      console.log(
        `✅ Scheduled standard notification for ${prayer} at ${notificationTime.toLocaleString()}`,
      );
      return id;
    } catch (error) {
      console.error('❌ Error scheduling standard notification:', error);
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

  private capitalizePrayer(prayer: string): string {
    return prayer.charAt(0).toUpperCase() + prayer.slice(1);
  }

  async cancelPrayerNotificationsForDate(date: string): Promise<void> {
    try {
      const triggerNotifications = await notifee.getTriggerNotifications();

      for (const trigger of triggerNotifications) {
        const notificationId = trigger.notification.id;
        if (notificationId && notificationId.includes(date)) {
          await notifee.cancelTriggerNotification(notificationId);
        }
      }

      console.log(`🧹 Cancelled existing notifications for ${date}`);
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      const triggerNotifications = await notifee.getTriggerNotifications();

      for (const trigger of triggerNotifications) {
        if (trigger.notification.id) {
          await notifee.cancelTriggerNotification(trigger.notification.id);
        }
      }

      console.log('🧹 Cancelled all notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

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

  async getScheduledNotifications(): Promise<any[]> {
    try {
      const triggerNotifications = await notifee.getTriggerNotifications();
      return triggerNotifications.map(trigger => ({
        id: trigger.notification.id,
        title: trigger.notification.title,
        body: trigger.notification.body,
        data: trigger.notification.data,
        trigger: trigger.trigger,
      }));
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export default UnifiedNotificationService;
