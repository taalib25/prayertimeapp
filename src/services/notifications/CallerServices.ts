import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  TriggerNotification,
} from '@notifee/react-native';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import UserPreferencesService from '../UserPreferencesService';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private isInitialized = false;
  private permissionsGranted = false;

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
        console.log(
          '🔋 Checking battery optimization... ',
          batteryOptimizationEnabled,
        );
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
 * Test fake call - working configuration
 */
async scheduleTestFakeCall(delaySeconds: number = 10): Promise<void> {
  try {
    await this.initialize();

    if (!this.permissionsGranted) {
      console.warn(
        '⚠️ Not all permissions granted, notification may not work properly',
      );
    }

    const testTime = new Date(Date.now() + delaySeconds * 1000);
    const preferencesService = UserPreferencesService.getInstance();
    const settings = await preferencesService.getNotificationSettings();

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
 * Simplified Fajr fake call - using exact same config as test function
 * @param reminderTime - Time in HH:MM format when the call should trigger
 * @param prayerTime - Original prayer time for display purposes
 */
async scheduleFajrFakeCall(
  reminderTime: string,
  prayerTime: string = '',
): Promise<string | null> {
  try {
    await this.initialize();

    if (!this.permissionsGranted) {
      console.warn(
        '⚠️ Not all permissions granted, notification may not work properly',
      );
    }

    // Parse the reminder time (HH:MM format)
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid reminder time format. Use HH:MM format.');
    }

    // Calculate when to trigger the notification
    const now = new Date();
    let reminderDateTime = new Date();
    reminderDateTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderDateTime <= now) {
      reminderDateTime.setDate(reminderDateTime.getDate() + 1);
    }

    const preferencesService = UserPreferencesService.getInstance();
    const settings = await preferencesService.getNotificationSettings();

    if (!settings) {
      console.log('Using default notification settings for Fajr call');
    }

    const id = `fajr-fake-call-${Date.now()}`;

    // Use EXACT same configuration as test function (which works)
    await notifee.createTriggerNotification(
      {
        id,
        title: '🌅 Fajr Wake-Up Call 📞',
        body: prayerTime ? `Time for Fajr prayer! (${prayerTime})` : 'Prayer Reminder Call',
        data: {
          type: 'fajr-fake-call',
          prayer: 'fajr',
          prayerTime,
          reminderTime,
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
        timestamp: reminderDateTime.getTime(),
      },
    );

    const delayMs = reminderDateTime.getTime() - now.getTime();
    const delayMinutes = Math.floor(delayMs / (1000 * 60));
    
    console.log(
      `🌅 Fajr fake call scheduled for ${reminderTime} (${delayMinutes} minutes from now) with ID: ${id}`,
    );
    
    return id;
  } catch (error) {
    console.error('❌ Failed to schedule Fajr fake call:', error);
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
      if (notificationId && notificationId.includes('fajr-fake-call')) {
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
