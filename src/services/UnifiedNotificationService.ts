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

      // Request permission first with detailed logging
      const permission = await notifee.requestPermission();
      console.log('📱 Permission result:', JSON.stringify(permission, null, 2));

      if (Platform.OS === 'android') {
        // Create channels with simplified configuration
        console.log('🔧 Creating Android notification channels...');

        await notifee.createChannel({
          id: this.channels.standard.id,
          name: this.channels.standard.name,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          description: 'Prayer time reminders',
        });

        await notifee.createChannel({
          id: this.channels.fullscreen.id,
          name: this.channels.fullscreen.name,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          description: 'Full-screen prayer call notifications',
        });

        console.log('✅ Notification channels created successfully');
      }

      // Set up notification event listeners for debugging
      this.setupNotificationListeners();

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
   * Schedule a test standard notification for testing purposes
   */
  async scheduleTestStandardNotification(
    uid: number,
    minutes: number,
  ): Promise<void> {
    try {
      const triggerTime = new Date();
      triggerTime.setMinutes(triggerTime.getMinutes() + minutes);

      const notificationId = `test-standard-${Date.now()}`;

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: '🧪 Test Standard Notification',
          body: `This is a test notification scheduled for ${minutes} minute${
            minutes > 1 ? 's' : ''
          } ago`,
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            actions: [
              {
                title: 'Dismiss',
                pressAction: {id: 'dismiss'},
              },
            ],
          },
          data: {
            type: 'test-standard',
            uid: uid.toString(),
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime.getTime(),
        },
      );

      console.log(
        `✅ Test standard notification scheduled for ${triggerTime.toLocaleTimeString()}`,
      );
    } catch (error) {
      console.error('❌ Error scheduling test standard notification:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications for debugging
   */
  async getScheduledNotifications(): Promise<TriggerNotification[]> {
    try {
      const scheduled = await notifee.getTriggerNotifications();
      console.log(`📊 Found ${scheduled.length} scheduled notifications`);
      return scheduled;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Schedule an immediate test notification (appears in 3 seconds)
   */
  async scheduleImmediateTestNotification(uid: number): Promise<string | null> {
    try {
      console.log('🧪 Scheduling immediate test notification...');

      // Check and request permissions first
      const permission = await notifee.requestPermission();
      console.log('📱 Permission status:', permission);

      if (permission.authorizationStatus !== 1) {
        console.log('❌ Notification permission not granted');
        throw new Error('Notification permission not granted');
      }

      await this.initialize();

      // Schedule for 3 seconds from now
      const result = await this.scheduleCustomNotification(
        uid,
        '🧪 Test Notification',
        'This is an immediate test notification!',
        3, // 3 seconds
        false,
      );

      if (result) {
        console.log(
          `✅ Immediate test notification scheduled with ID: ${result}`,
        );
      }

      return result;
    } catch (error) {
      console.error(
        '❌ Failed to schedule immediate test notification:',
        error,
      );
      throw error;
    }
  }

  /**
   * Display immediate notification (no delay) for testing
   */
  async displayImmediateNotification(
    uid: number,
    title: string = '🧪 Immediate Test',
    body: string = 'This notification appears immediately!',
    isFullscreen: boolean = false,
  ): Promise<string | null> {
    try {
      console.log('🚀 Displaying immediate notification...');

      await this.initialize();

      const id = `immediate-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      if (isFullscreen) {
        console.log('📱 Creating immediate fullscreen notification...');
        await notifee.displayNotification({
          id,
          title,
          body,
          data: {
            type: 'immediate-fullscreen',
            uid: uid.toString(),
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
          },
          ios: {
            critical: true,
            criticalVolume: 1.0,
          },
        });
      } else {
        console.log('📱 Creating immediate standard notification...');
        await notifee.displayNotification({
          id,
          title,
          body,
          data: {
            type: 'immediate-standard',
            uid: uid.toString(),
            notificationId: id,
          },
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            vibrationPattern: [300, 500, 300, 500],
            autoCancel: true,
            pressAction: {
              id: 'default',
            },
          },
        });
      }

      console.log(`✅ Immediate notification displayed with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error displaying immediate notification:', error);
      throw error;
    }
  }

  /**
   * Enhanced permission and settings check
   */
  async checkNotificationCapabilities(): Promise<{
    permission: any;
    channels: any[];
    settings: any;
    powerManager: any;
  }> {
    try {
      console.log('🔍 Checking notification capabilities...');

      const permission = await notifee.requestPermission();
      console.log('📱 Permission:', permission);

      let channels: any[] = [];
      let powerManager: any = null;

      if (Platform.OS === 'android') {
        channels = await notifee.getChannels();
        console.log('📺 Channels:', channels);

        powerManager = await notifee.getPowerManagerInfo();
        console.log('🔋 Power Manager:', powerManager);
      }

      const settings = await notifee.getNotificationSettings();
      console.log('⚙️ Notification Settings:', settings);

      return {
        permission,
        channels,
        settings,
        powerManager,
      };
    } catch (error) {
      console.error('❌ Error checking capabilities:', error);
      throw error;
    }
  }

  /**
   * Simple trigger notification with minimal configuration
   */
  async scheduleSimpleTestNotification(
    uid: number,
    delaySeconds: number = 5,
  ): Promise<string | null> {
    try {
      console.log(
        `🧪 Scheduling simple test notification for ${delaySeconds} seconds...`,
      );

      await this.initialize();

      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      const id = `simple-test-${Date.now()}`;

      console.log(`📅 Scheduling for: ${notificationTime.toLocaleString()}`);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: '🧪 Simple Test Notification',
          body: `This notification was scheduled for ${delaySeconds} seconds delay`,
          data: {
            type: 'simple-test',
            uid: uid.toString(),
          },
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            vibrationPattern: [300, 500],
            pressAction: {
              id: 'default',
            },
          },
        },
        trigger,
      );

      console.log(`✅ Simple test notification scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling simple test notification:', error);
      throw error;
    }
  }

  async scheduleFullscreenTestNotification(
    uid: number,
    delaySeconds: number = 5,
  ): Promise<string | null> {
    try {
      console.log(
        `📱 Scheduling fullscreen test notification for ${delaySeconds} seconds...`,
      );

      await this.initialize();

      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      const id = `fullscreen-test-${Date.now()}`;

      console.log(
        `📅 Scheduling fullscreen for: ${notificationTime.toLocaleString()}`,
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
            type: 'fullscreen-test',
            uid: uid.toString(),
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
            critical: true,
            criticalVolume: 1.0,
          },
        },
        trigger,
      );

      console.log(`✅ Fullscreen test notification scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling fullscreen test notification:', error);
      throw error;
    }
  }
}

export default UnifiedNotificationService;
