import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  TriggerNotification,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import UserPreferencesService from './UserPreferencesService';
import {getPrayerTimesForDate} from './db/PrayerServices';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private preferencesService: UserPreferencesService;
  private isInitialized = false;

  // Define channels structure for better organization
  private channels = {
    standard: {
      id: 'prayer-notifications-standard',
      name: 'Prayer Notifications',
      importance: AndroidImportance.HIGH,
    },
    fullscreen: {
      id: 'prayer-notifications-fullscreen',
      name: 'Prayer Call Notifications',
      importance: AndroidImportance.HIGH,
    },
  };

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

      // Request permission first
      await notifee.requestPermission();

      if (Platform.OS === 'android') {
        // Create channels in parallel for better performance
        await Promise.all([
          notifee.createChannel({
            id: this.channels.standard.id,
            name: this.channels.standard.name,
            importance: this.channels.standard.importance,
            visibility: AndroidVisibility.PUBLIC,
            sound: 'default',
            vibration: true,
            description: 'Prayer time reminders',
          }),
          notifee.createChannel({
            id: this.channels.fullscreen.id,
            name: this.channels.fullscreen.name,
            importance: this.channels.fullscreen.importance,
            visibility: AndroidVisibility.PUBLIC,
            sound: 'ringtone',
            vibration: true,
            description: 'Full-screen prayer call notifications',
          }),
        ]);
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      throw error;
    }
  }

  private setupNotificationListeners(): void {
    // Listen for notification events
    notifee.onForegroundEvent(({type, detail}) => {
      console.log('📱 Foreground notification event:', type, detail);
    });

    notifee.onBackgroundEvent(async ({type, detail}) => {
      console.log('📱 Background notification event:', type, detail);
    });
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

  async scheduleCustomNotification(
    uid: number,
    title: string,
    body: string,
    delaySeconds: number,
    isFullscreen: boolean = false,
  ): Promise<string | null> {
    try {
      await this.initialize();

      // Fix: Convert seconds to milliseconds properly
      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      console.log(
        `🕐 Scheduling notification for: ${notificationTime.toLocaleString()}`,
      );

      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );

      if (!settings) {
        console.log('❌ No notification settings found, using defaults');
        // Use default settings if none found
        const defaultSettings = {
          notifications: true,
          notification_types: {sound: true, vibration: true},
          dnd_bypass: false,
          adhan_sound: 'default',
        };

        return await this.createNotificationWithSettings(
          uid,
          title,
          body,
          notificationTime,
          isFullscreen,
          defaultSettings,
        );
      }

      if (!settings.notifications) {
        console.log('❌ Notifications disabled in settings');
        return null;
      }

      return await this.createNotificationWithSettings(
        uid,
        title,
        body,
        notificationTime,
        isFullscreen,
        settings,
      );
    } catch (error) {
      console.error('❌ Error scheduling custom notification:', error);
      return null;
    }
  }

  private async createNotificationWithSettings(
    uid: number,
    title: string,
    body: string,
    notificationTime: Date,
    isFullscreen: boolean,
    settings: any,
  ): Promise<string | null> {
    const id = `custom-notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: notificationTime.getTime(),
    };

    console.log(
      `📅 Trigger timestamp: ${trigger.timestamp} (${new Date(
        trigger.timestamp,
      ).toLocaleString()})`,
    );

    if (isFullscreen) {
      await notifee.createTriggerNotification(
        {
          id,
          title,
          body,
          data: {
            type: 'custom-fullscreen',
            uid: uid.toString(),
            notificationId: id,
            screen: 'FakeCallScreen',
            returnTo: 'MainApp',
          },
          android: {
            channelId: this.channels.fullscreen.id,
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
    } else {
      await notifee.createTriggerNotification(
        {
          id,
          title,
          body,
          data: {
            type: 'custom-standard',
            uid: uid.toString(),
            notificationId: id,
          },
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: settings.notification_types?.sound ? 'default' : undefined,
            vibrationPattern: settings.notification_types?.vibration
              ? [300, 500, 300, 500]
              : undefined,
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: settings.notification_types?.sound ? 'default' : undefined,
            critical: settings.dnd_bypass,
            criticalVolume: settings.dnd_bypass ? 1.0 : 0.7,
          },
        },
        trigger,
      );
    }

    console.log(
      `✅ Scheduled custom ${
        isFullscreen ? 'fullscreen' : 'standard'
      } notification for ${notificationTime.toLocaleString()} with ID: ${id}`,
    );
    return id;
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
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            vibrationPattern: [300, 500, 300, 500],
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            critical: settings.dnd_bypass || false,
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
            notificationId: id,
          },
          android: {
            channelId: this.channels.fullscreen.id,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            visibility: AndroidVisibility.PUBLIC,
            fullScreenAction: {
              id: 'full-screen',
            },
            pressAction: {
              id: 'default',
            },
            vibrationPattern: [300, 500, 300, 500],
            autoCancel: true,
            lightUpScreen: true,
            timeoutAfter: 30000,
          },
          ios: {
            critical: settings.dnd_bypass || false,
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
            channelId: this.channels.fullscreen.id,
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

  /**
   * Schedule prayer notifications for today with repeat capability
   */
  async scheduleTodayPrayerNotifications(uid: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.scheduleDailyPrayerNotifications(uid, today);
    } catch (error) {
      console.error('❌ Error scheduling today prayer notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule a simple test notification
   */
  async scheduleTestNotification(
    uid: number,
    delaySeconds: number = 5,
  ): Promise<string | null> {
    try {
      console.log(
        `🧪 Scheduling test notification for ${delaySeconds} seconds...`,
      );

      await this.initialize();

      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      const id = `test-notification-${Date.now()}`;

      console.log(`📅 Scheduling for: ${notificationTime.toLocaleString()}`);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: '🧪 Test Notification',
          body: `This notification was scheduled for ${delaySeconds} seconds delay`,
          data: {
            type: 'test-notification',
            uid: uid.toString(),
          },
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        trigger,
      );

      console.log(`✅ Test notification scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
      throw error;
    }
  }

  /**
   * Test fullscreen notification with proper fake call configuration
   */
  async scheduleTestFullscreenCall(
    uid: number,
    delaySeconds: number = 5,
  ): Promise<string | null> {
    try {
      console.log(
        `📱 Scheduling fullscreen call test for ${delaySeconds} seconds...`,
      );

      await this.initialize();

      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      const id = `fullscreen-call-test-${Date.now()}`;

      console.log(
        `📅 Scheduling fullscreen call for: ${notificationTime.toLocaleString()}`,
      );

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: '📞 Incoming Call',
          body: 'Prayer Reminder Call',
          data: {
            type: 'fake-call',
            uid: uid.toString(),
            prayer: 'test-call',
            screen: 'FakeCallScreen',
            notificationId: id,
            returnTo: 'MainApp',
          },
          android: {
            channelId: this.channels.fullscreen.id,
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
            smallIcon: 'ic_notification',
            localOnly: true,
          },
          ios: {
            sound: 'ringtone.caf',
            critical: true,
            criticalVolume: 1.0,
          },
        },
        trigger,
      );

      console.log(`✅ Fullscreen call test scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling fullscreen call test:', error);
      throw error;
    }
  }
}

export default UnifiedNotificationService;
