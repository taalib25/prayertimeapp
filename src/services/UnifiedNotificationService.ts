import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  TriggerNotification,
  AndroidColor,
} from '@notifee/react-native';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import UserPreferencesService from './UserPreferencesService';
import {getPrayerTimesForDate} from './db/PrayerServices';
import {getTodayDateString} from '../utils/helpers';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private preferencesService: UserPreferencesService;
  private isInitialized = false;
  private permissionsGranted = false;

  /**
   * Generate notification ID with encoded prayer time
   */
  private generatePrayerNotificationId(
    prayer: string,
    uid: number,
    prayerTime: string,
  ): string {
    // Encode time in the ID: prayer-fajr-1001-0530 (for 05:30)
    const timeEncoded = prayerTime.replace(':', '');
    return `prayer-${prayer}-${uid}-${timeEncoded}`;
  }

  // Enhanced channels structure with loud notification settings
  private channels = {
    standard: {
      id: 'prayer-notifications-standard',
      name: 'Prayer Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibration: true,
      vibrationPattern: [500, 1000, 500, 1000, 500, 1000],
      visibility: AndroidVisibility.PUBLIC,
    },
    fullscreen: {
      id: 'prayer-notifications-fullscreen',
      name: 'Prayer Call Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500, 300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
    },
    urgent: {
      id: 'prayer-notifications-urgent',
      name: 'Urgent Prayer Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'alarm_sound',
      vibration: true,
      vibrationPattern: [1000, 1000, 1000, 1000, 1000, 1000],
      visibility: AndroidVisibility.PUBLIC,
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

  /**
   * Comprehensive permission handler
   */
  async requestAllPermissions(): Promise<{
    granted: boolean;
    permissions: any;
    warnings: string[];
  }> {
    console.log('🔐 Starting comprehensive permission request...');

    const permissions = {
      notifications: false,
      postNotifications: false,
      fullScreenIntent: false,
      batteryOptimization: false,
      dndAccess: false,
    };

    const warnings: string[] = [];

    try {
      // 1. Basic notification permission
      console.log('📱 Requesting basic notification permission...');
      const notificationPermission = await notifee.requestPermission();
      permissions.notifications =
        notificationPermission.authorizationStatus === 1;

      if (!permissions.notifications) {
        warnings.push('Basic notification permission denied');
      }

      // 2. Android 13+ POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('📱 Requesting POST_NOTIFICATIONS permission...');
        try {
          const postNotificationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Prayer Notifications',
              message:
                'This app needs notification permission to remind you about prayer times.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          permissions.postNotifications =
            postNotificationGranted === PermissionsAndroid.RESULTS.GRANTED;

          if (!permissions.postNotifications) {
            warnings.push(
              'POST_NOTIFICATIONS permission denied - notifications may not work properly',
            );
          }
        } catch (error) {
          console.error('Error requesting POST_NOTIFICATIONS:', error);
          warnings.push('Failed to request POST_NOTIFICATIONS permission');
        }
      } else {
        permissions.postNotifications = true;
      }

      // 3. Full-screen intent permission (Android 14+)
      if (Platform.OS === 'android' && Platform.Version >= 34) {
        console.log('📱 Checking full-screen intent permission...');
        try {
          const canUseFullScreenIntent =
            await this.checkFullScreenIntentPermission();
          permissions.fullScreenIntent = canUseFullScreenIntent;

          if (!permissions.fullScreenIntent) {
            warnings.push(
              'Full-screen intent permission required for lock screen notifications',
            );
          }
        } catch (error) {
          console.error('Error checking full-screen intent permission:', error);
          warnings.push('Could not verify full-screen intent permission');
        }
      } else {
        permissions.fullScreenIntent = true;
      }

      // 4. Battery optimization check
  
      try {
        const batteryOptimizationEnabled =
          await notifee.isBatteryOptimizationEnabled();
        permissions.batteryOptimization = !batteryOptimizationEnabled;
        console.log('🔋 Checking battery optimization... ',batteryOptimizationEnabled);
        // if (batteryOptimizationEnabled) {
        //   // warnings.push(
        //   //   'Battery optimization is enabled - may affect notification delivery',
        //   // );
        //   // Show battery optimization dialog
        //   await this.showBatteryOptimizationDialog();
        // }
      } catch (error) {
        console.error('Error checking battery optimization:', error);
        warnings.push('Could not check battery optimization status');
      }

      // Determine overall permission status
      const criticalPermissions = [
        permissions.notifications,
        permissions.postNotifications,
      ];

      const allCriticalGranted = criticalPermissions.every(p => p === true);

      console.log('📊 Permission Summary:', permissions);
      console.log('⚠️ Warnings:', warnings);

      return {
        granted: allCriticalGranted,
        permissions,
        warnings,
      };
    } catch (error) {
      console.error('❌ Error in permission request:', error);
      warnings.push('Failed to complete permission request');

      return {
        granted: false,
        permissions,
        warnings,
      };
    }
  }

  /**
   * Check if full-screen intent permission is available (Android 14+)
   */
  private async checkFullScreenIntentPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 34) {
        // This is a simplified check - in real implementation, you'd need to check
        // the actual system permission state
        return true; // Assume granted for now
      }
      return true;
    } catch (error) {
      console.error('Error checking full-screen intent permission:', error);
      return false;
    }
  }

  /**
   * Show battery optimization dialog
   */
  private async showBatteryOptimizationDialog(): Promise<void> {
    try {
      Alert.alert(
        'Battery Optimization Detected',
        'For reliable prayer notifications, please disable battery optimization for this app. This ensures notifications work even when the app is in the background.',
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await notifee.openBatteryOptimizationSettings();
              } catch (error) {
                console.error(
                  'Error opening battery optimization settings:',
                  error,
                );
                Linking.openSettings();
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error showing battery optimization dialog:', error);
    }
  }

  /**
   * Show permission guidance dialog
   */
  async showPermissionGuidance(warnings: string[]): Promise<void> {
    if (warnings.length === 0) return;

    const warningText = warnings.join('\n• ');

    Alert.alert(
      'Permission Setup Required',
      `To ensure prayer notifications work properly, please address these issues:\n\n• ${warningText}`,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => this.openNotificationSettings(),
        },
      ],
    );
  }

  /**
   * Open notification settings for manual configuration
   */
  async openNotificationSettings(): Promise<void> {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
      // Fallback to app settings
      Linking.openSettings();
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📱 Notification service already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing notification service...');

      // Request all permissions
      const permissionResult = await this.requestAllPermissions();
      this.permissionsGranted = permissionResult.granted;

      // Show guidance if there are warnings
      if (permissionResult.warnings.length > 0) {
        await this.showPermissionGuidance(permissionResult.warnings);
      }

      if (Platform.OS === 'android') {
        // Create enhanced channels with loud settings
        await this.createEnhancedChannels();
        console.log('✅ Enhanced notification channels created');
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      // Initialize with basic settings even if some permissions fail
      this.isInitialized = true;
    }
  }

  /**
   * Create enhanced notification channels with loud settings
   */
  private async createEnhancedChannels(): Promise<void> {
    // Standard channel with enhanced settings
    await notifee.createChannel({
      id: this.channels.standard.id,
      name: this.channels.standard.name,
      importance: this.channels.standard.importance,
      sound: this.channels.standard.sound,
      vibration: this.channels.standard.vibration,
      vibrationPattern: this.channels.standard.vibrationPattern,
      visibility: this.channels.standard.visibility,
    });

    // Fullscreen channel with maximum impact
    await notifee.createChannel({
      id: this.channels.fullscreen.id,
      name: this.channels.fullscreen.name,
      importance: this.channels.fullscreen.importance,
      sound: this.channels.fullscreen.sound,
      vibration: this.channels.fullscreen.vibration,
      vibrationPattern: this.channels.fullscreen.vibrationPattern,
      visibility: this.channels.fullscreen.visibility,
    });

    // Urgent channel for emergency-level notifications
    await notifee.createChannel({
      id: this.channels.urgent.id,
      name: this.channels.urgent.name,
      importance: this.channels.urgent.importance,
      sound: this.channels.urgent.sound,
      vibration: this.channels.urgent.vibration,
      vibrationPattern: this.channels.urgent.vibrationPattern,
      visibility: this.channels.urgent.visibility,
    });
  }

  /**
   * Check if notification with same time already exists
   */
  private async isPrayerNotificationUpToDate(
    prayer: string,
    uid: number,
    currentTime: string,
  ): Promise<boolean> {
    try {
      const expectedId = this.generatePrayerNotificationId(
        prayer,
        uid,
        currentTime,
      );
      const scheduled = await notifee.getTriggerNotifications();

      return scheduled.some(
        notification => notification.notification.id === expectedId,
      );
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Optimized scheduling with automatic time comparison
   */
  async scheduleDailyPrayerNotifications(
    uid: number,
    checkDate: string = getTodayDateString(),
  ): Promise<void> {
    try {
      console.log(`🔔 Checking prayer notifications for ${checkDate}...`);

      await this.initialize();

      const newPrayerTimes = await getPrayerTimesForDate(checkDate);
      if (!newPrayerTimes) {
        console.log(`❌ No prayer times found for ${checkDate}`);
        return;
      }

      const settings = {
        notifications: true,
        notification_types: {standard: true, fullscreen: false},
        prayer_specific: {
          fajr: true,
          dhuhr: true,
          asr: true,
          maghrib: true,
          isha: true,
        },
        reminder_minutes_before: 10,
      };

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      let updatedCount = 0;

      for (const prayer of prayers) {
        if (
          !settings.prayer_specific[
            prayer as keyof typeof settings.prayer_specific
          ]
        ) {
          continue;
        }

        const prayerTime = newPrayerTimes[
          prayer as keyof typeof newPrayerTimes
        ] as string;
        if (!prayerTime) {
          continue;
        }

        // Check if notification with this exact time already exists
        const isUpToDate = await this.isPrayerNotificationUpToDate(
          prayer,
          uid,
          prayerTime,
        );

        if (isUpToDate) {
          console.log(
            `✅ ${prayer} notification already up-to-date (${prayerTime})`,
          );
          continue;
        }

        console.log(`🔄 Updating ${prayer} notification (${prayerTime})`);

        // Cancel old notification for this prayer
        await this.cancelPrayerNotification(prayer, uid);

        // Schedule new one with current time
        const notificationTime = this.getNextNotificationTime(
          prayerTime,
          settings.reminder_minutes_before,
        );
        await this.scheduleRepeatingNotification(
          uid,
          prayer,
          prayerTime,
          notificationTime,
          settings,
        );

        updatedCount++;
      }

      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} prayer notifications`);
      } else {
        console.log('✅ All prayer notifications are up-to-date');
      }
    } catch (error) {
      console.error('❌ Error scheduling prayer notifications:', error);
      throw error;
    }
  }

  /**
   * Calculate the next notification time based on prayer time and reminder minutes
   */
  private getNextNotificationTime(
    prayerTime: string,
    minutesBefore: number,
  ): Date {
    const today = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);

    const prayerDateTime = new Date();
    prayerDateTime.setHours(hours, minutes, 0, 0);

    // Subtract reminder minutes
    const notificationTime = new Date(
      prayerDateTime.getTime() - minutesBefore * 60 * 1000,
    );

    // If the notification time has passed today, schedule for tomorrow
    if (notificationTime <= today) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    return notificationTime;
  }

  /**
   * Schedule repeating notification with time-encoded ID
   */
  private async scheduleRepeatingNotification(
    uid: number,
    prayer: string,
    prayerTime: string,
    notificationTime: Date,
    settings: any,
  ): Promise<string | null> {
    try {
      // Use time-encoded ID
      const id = this.generatePrayerNotificationId(prayer, uid, prayerTime);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: 'Prayer Time 🕌',
          body: `${this.capitalizePrayer(
            prayer,
          )} prayer time is approaching (${prayerTime})`,
          data: {
            type: 'prayer-reminder',
            uid: uid.toString(),
            prayer,
            prayerTime,
            notificationId: id,
          },
          android: {
            channelId: this.channels.standard.id,
            importance: AndroidImportance.HIGH,
            pressAction: {id: 'default'},
          },
        },
        trigger,
      );

      console.log(
        `✅ Scheduled ${prayer} daily notification at ${prayerTime} (ID: ${id})`,
      );
      return id;
    } catch (error) {
      console.error(`❌ Error scheduling ${prayer} notification:`, error);
      return null;
    }
  }

  /**
   * Cancel specific prayer notification
   */
  private async cancelPrayerNotification(
    prayer: string,
    uid: number,
  ): Promise<void> {
    try {
      const scheduled = await notifee.getTriggerNotifications();

      // Cancel any existing notification for this prayer (regardless of time)
      for (const notification of scheduled) {
        const id = notification.notification.id;
        if (id && id.startsWith(`prayer-${prayer}-${uid}-`)) {
          await notifee.cancelTriggerNotification(id);
          console.log(`🗑️ Cancelled old ${prayer} notification: ${id}`);
        }
      }
    } catch (error) {
      console.error(`Error cancelling ${prayer} notification:`, error);
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

  private capitalizePrayer(prayer: string): string {
    return prayer.charAt(0).toUpperCase() + prayer.slice(1);
  }

  // async cancelAllNotifications(): Promise<void> {
  //   try {
  //     await notifee.cancelAllNotifications();
  //     const triggerNotifications = await notifee.getTriggerNotifications();

  //     for (const trigger of triggerNotifications) {
  //       if (trigger.notification.id) {
  //         await notifee.cancelTriggerNotification(trigger.notification.id);
  //       }
  //     }

  //     console.log('🧹 Cancelled all notifications');
  //   } catch (error) {
  //     console.error('❌ Error cancelling all notifications:', error);
  //   }
  // }

  /**
   * Schedule prayer notifications for today with repeat capability
   */
  async scheduleTodayPrayerNotifications(uid: number): Promise<void> {
    try {
      const today = getTodayDateString();
      await this.scheduleDailyPrayerNotifications(uid, today);
    } catch (error) {
      console.error('❌ Error scheduling today prayer notifications:', error);
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
        `📱 Scheduling enhanced fullscreen call test for ${delaySeconds} seconds...`,
      );

      await this.initialize();

      if (!this.permissionsGranted) {
        console.warn(
          '⚠️ Not all permissions granted, notification may not work properly',
        );
      }

      const notificationTime = new Date(Date.now() + delaySeconds * 1000);
      const id = `enhanced-fullscreen-call-test-${Date.now()}`;

      console.log(
        `📅 Scheduling enhanced fullscreen call for: ${notificationTime.toLocaleString()}`,
      );

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: '� URGENT: Prayer Call 📞',
          body: 'Enhanced Prayer Reminder Call - Maximum Impact!',
          data: {
            type: 'enhanced-fake-call',
            uid: uid.toString(),
            prayer: 'test-call',
            screen: 'FakeCallScreen',
            notificationId: id,
            returnTo: 'MainApp',
            enhanced: 'true',
          },
          android: {
            channelId: this.channels.fullscreen.id,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            visibility: AndroidVisibility.PUBLIC,

            // Enhanced press and full-screen actions
            pressAction: {
              id: 'default',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            fullScreenAction: {
              id: 'full-screen',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },

            // Maximum sound and vibration impact
            sound: 'ringtone',
            vibrationPattern: [500, 1000, 500, 1000, 500, 1000, 500, 1000],

            // Behavior settings
            ongoing: false,
            autoCancel: true,
            lightUpScreen: true,
            onlyAlertOnce: false,
            timeoutAfter: 30000,
            smallIcon: 'ic_notification',
            localOnly: true,

            // Actions for user interaction
            actions: [
              {
                title: '✅ Accept',
                pressAction: {
                  id: 'accept-call',
                  launchActivity: 'com.prayer_app.FakeCallActivity',
                },
              },
              {
                title: '❌ Decline',
                pressAction: {
                  id: 'decline-call',
                },
              },
            ],
          },
          ios: {
            sound: 'ringtone.caf',
            critical: true,
            criticalVolume: 1.0,
          },
        },
        trigger,
      );

      console.log(`✅ Enhanced fullscreen call test scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error(
        '❌ Error scheduling enhanced fullscreen call test:',
        error,
      );
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

  async scheduleTestFakeCall(
    uid: number,
    delaySeconds: number = 10,
  ): Promise<void> {
    try {
      await this.initialize();

      if (!this.permissionsGranted) {
        console.warn(
          '⚠️ Not all permissions granted, notification may not work properly',
        );
      }

      const testTime = new Date(Date.now() + delaySeconds * 1000);
      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );

      if (!settings) {
        console.log('Using default notification settings for test');
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
            vibrationPattern: [300, 500, 300, 500, 300, 500],
            ongoing: false,
            autoCancel: true,
            lightUpScreen: true,
            onlyAlertOnce: false,
            timeoutAfter: 30000,
            localOnly: true,
          },
          ios: {
            sound: 'ringtone.caf',
            critical: true,
            criticalVolume: 1.0,
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
   * Enhanced Fajr fake call with all loud notification features
   */
  async scheduleFajrFakeCall(
    uid: number,
    prayerTime: string,
    minutesOffset: number,
    timing: 'before' | 'after',
  ): Promise<string | null> {
    try {
      await this.initialize();

      if (!this.permissionsGranted) {
        console.warn(
          '⚠️ Not all permissions granted, notification may not work properly',
        );
      }

      // Calculate the reminder time
      const [hours, minutes] = prayerTime.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      let reminderMinutes;
      if (timing === 'before') {
        reminderMinutes = prayerMinutes - minutesOffset;
      } else {
        reminderMinutes = prayerMinutes + minutesOffset;
      }

      // Handle day overflow/underflow
      if (reminderMinutes < 0) {
        reminderMinutes += 24 * 60;
      } else if (reminderMinutes >= 24 * 60) {
        reminderMinutes -= 24 * 60;
      }

      const reminderHours = Math.floor(reminderMinutes / 60);
      const reminderMins = reminderMinutes % 60;

      // Calculate delay until the reminder time
      const now = new Date();
      let reminderDateTime = new Date();
      reminderDateTime.setHours(reminderHours, reminderMins, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (reminderDateTime <= now) {
        reminderDateTime.setDate(reminderDateTime.getDate() + 1);
      }

      const delayMs = reminderDateTime.getTime() - now.getTime();
      const delaySeconds = Math.floor(delayMs / 1000);

      if (delaySeconds <= 0) {
        throw new Error('Calculated reminder time is in the past');
      }

      const settings = await this.preferencesService.getNotificationSettings(
        uid,
      );
      if (!settings) {
        console.log('Using default notification settings for Fajr call');
      }

      const id = `fajr-fake-call-${Date.now()}`;
      const reminderTimeString = `${reminderHours
        .toString()
        .padStart(2, '0')}:${reminderMins.toString().padStart(2, '0')}`;

      await notifee.createTriggerNotification(
        {
          id,
          title: '🌅 Fajr Wake-Up Call 🚨',
          body: `Time for Fajr prayer! (${prayerTime})`,
          data: {
            type: 'fajr-fake-call',
            uid: uid.toString(),
            prayer: 'fajr',
            prayerTime,
            reminderTime: reminderTimeString,
            timing,
            minutesOffset: minutesOffset.toString(),
            screen: 'FakeCallScreen',
            notificationId: id,
            returnTo: 'MainApp',
            enhanced: 'true',
          },
          android: {
            channelId: this.channels.fullscreen.id,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            visibility: AndroidVisibility.PUBLIC,

            // Enhanced press and full-screen actions
            pressAction: {
              id: 'default',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            fullScreenAction: {
              id: 'full-screen',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },

            // Maximum sound and vibration for Fajr
            sound: 'ringtone',
            vibrationPattern: [1000, 1000, 1000, 1000, 1000, 1000],

            // Behavior settings
            ongoing: false,
            autoCancel: true,
            lightUpScreen: true,
            onlyAlertOnce: false,
            timeoutAfter: 30000,
            localOnly: true,
          },
          ios: {
            sound: 'ringtone.caf',
            critical: true,
            criticalVolume: 1.0,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: reminderDateTime.getTime(),
        },
      );

      console.log(
        `Enhanced Fajr fake call scheduled for ${reminderTimeString} (${Math.floor(
          delaySeconds / 60,
        )} minutes from now)`,
      );
      return id;
    } catch (error) {
      console.error('❌ Failed to schedule enhanced Fajr fake call:', error);
      throw error;
    }
  }

  /**
   * Cancel all Fajr fake calls
   */
  async cancelFajrFakeCalls(): Promise<void> {
    try {
      const triggerNotifications = await notifee.getTriggerNotifications();

      for (const trigger of triggerNotifications) {
        const notificationId = trigger.notification.id;
        if (notificationId && notificationId.includes('fajr-fake-call-')) {
          await notifee.cancelTriggerNotification(notificationId);
          console.log(`🗑️ Cancelled Fajr fake call: ${notificationId}`);
        }
      }

      console.log('🧹 Cancelled all Fajr fake calls');
    } catch (error) {
      console.error('❌ Error cancelling Fajr fake calls:', error);
    }
  }

  /**
   * Cancel all notifications
   */
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

  /**
   * Get permission status for debugging
   */
  async getPermissionStatus(): Promise<any> {
    try {
      const result = await this.requestAllPermissions();
      return {
        isInitialized: this.isInitialized,
        permissionsGranted: this.permissionsGranted,
        ...result,
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        isInitialized: this.isInitialized,
        permissionsGranted: this.permissionsGranted,
        error: (error as Error).message,
      };
    }
  }
}

export default UnifiedNotificationService;
