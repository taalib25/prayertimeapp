import notifee, { 
  AndroidImportance, 
  TriggerType, 
  AuthorizationStatus,
  Trigger
} from '@notifee/react-native';
import { NOTIFICATION_CHANNELS, PRAYER_DISPLAY_NAMES, formatDateYMD, formatTime } from '../../utils/helpers';
import { PrayerNotification, PrayerName } from '../../utils/types';
import { Platform } from 'react-native';

class NotificationService {
  private static prayerChannelId: string | null = null;
  private static systemChannelId: string | null = null;

  static async initialize(): Promise<void> {
    try {
      // Request permission with additional settings
      const settings = await notifee.requestPermission({
        alert: true,
        badge: true,
        sound: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
      });
      
      if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        console.warn('⚠️ Notification permission not fully authorized:', settings.authorizationStatus);
        // Don't throw error, continue with limited functionality
      }

      // Check battery optimization (Android)
      if (Platform.OS === 'android') {
        const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
        if (batteryOptimizationEnabled) {
          console.warn('⚠️ Battery optimization enabled - may affect notifications');
        }
      }

      // Create channels
      await this.createChannels();
      
      console.log('✅ NotificationService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  private static async createChannels(): Promise<void> {
    try {
      // Prayer reminders channel
      this.prayerChannelId = await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.PRAYER_REMINDERS,
        name: 'Prayer Time Reminders',
        description: 'Notifications for prayer times',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        lights: true,
        lightColor: '#2E7D32',
      });

      // System channel for triggers
      this.systemChannelId = await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.PRAYER_SYSTEM,
        name: 'Prayer System',
        description: 'System notifications for prayer updates',
        importance: AndroidImportance.LOW,
        vibration: false,
      });

      console.log('✅ Notification channels created successfully');
    } catch (error) {
      console.error('❌ Failed to create notification channels:', error);
      throw error;
    }
  }

  // In scheduleNotification method, add explicit verification:

static async scheduleNotification(notification: PrayerNotification): Promise<void> {
  try {
    const { id, prayer, originalTime, notificationTime, date } = notification;
    const now = new Date();

    if (originalTime.getTime() <= now.getTime()) {
      console.warn(`⚠️ Skipping notification for past prayer: ${id}`);
      return;
    }

    let scheduledTime = notificationTime;
    if (scheduledTime.getTime() <= now.getTime()) {
      scheduledTime = new Date(now.getTime() + 5 * 1000);
      console.log(`⚡ Adjusted notification time to immediate for ${id}`);
    }

    const triggerTimestamp = scheduledTime.getTime();

    await notifee.createTriggerNotification(
      {
        id,
        title: `🕌 ${PRAYER_DISPLAY_NAMES[prayer as PrayerName]}`,
        body: `Prayer time in 15 minutes • ${formatTime(originalTime)}`,
        android: {
          channelId: this.prayerChannelId!,
          color: '#2E7D32',
          vibrationPattern: [300, 500, 300, 500],
          showTimestamp: true,
          timestamp: triggerTimestamp,
          autoCancel: true,
          ongoing: false,
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: "default",
          critical: false,
          categoryId: 'prayer-reminder',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTimestamp,
      } as Trigger
    );

    // CRITICAL DEBUG: Log actual scheduled notification details
    console.log(`📝 SCHEDULED: ${id}`);
    console.log(`   Timestamp: ${triggerTimestamp}`);
    console.log(`   Date: ${new Date(triggerTimestamp).toLocaleString()}`);
    console.log(`   Prayer Date ID: ${formatDateYMD(date)}`);

    // VERIFICATION: Immediately check if it was actually scheduled
    setTimeout(async () => {
      const scheduled = await notifee.getTriggerNotifications();
      const found = scheduled.find(n => n.notification.id === id);
      if (found) {
        console.log(`✅ VERIFIED: ${id} is in system with timestamp ${found.trigger.timestamp}`);
      } else {
        console.error(`❌ MISSING: ${id} not found in scheduled notifications!`);
      }
    }, 100);

  } catch (error) {
    console.error('❌ Failed to schedule notification:', error, { 
      notificationId: notification.id,
      scheduledTime: notification.notificationTime.toISOString() 
    });
    throw error;
  }
}


  static async batchScheduleNotifications(notifications: PrayerNotification[]): Promise<number> {
    try {
      console.log(`📅 Scheduling ${notifications.length} prayer notifications...`);
      
      // FIXED: Filter by originalTime (prayer time) instead of notificationTime
      const now = new Date();
      const futureNotifications = notifications.filter(
        notif => notif.originalTime.getTime() > now.getTime()
      );

      if (futureNotifications.length !== notifications.length) {
        console.warn(`⚠️ Filtered out ${notifications.length - futureNotifications.length} past prayers`);
      }

      const batchSize = 20;
      let scheduledCount = 0;
      let errorCount = 0;

      for (let i = 0; i < futureNotifications.length; i += batchSize) {
        const batch = futureNotifications.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (notif) => {
            await this.scheduleNotification(notif);
            return notif.id;
          })
        );

        // Count successes and failures
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            scheduledCount++;
          } else {
            errorCount++;
            console.error(`❌ Failed to schedule ${batch[index].id}:`, result.reason);
          }
        });

        // Delay between batches
        if (i + batchSize < futureNotifications.length) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      console.log(`✅ Successfully scheduled ${scheduledCount} notifications (${errorCount} errors)`);
      return scheduledCount;
    } catch (error) {
      console.error('❌ Failed to batch schedule notifications:', error);
      throw error;
    }
  }

  static async clearAllPrayerNotifications(): Promise<void> {
    try {
      const existingNotifications = await notifee.getTriggerNotifications();
      const prayerNotifications = existingNotifications.filter(
        notif => notif.notification.id?.includes('-prayer-')
      );

      if (prayerNotifications.length === 0) {
        console.log('ℹ️ No prayer notifications to clear');
        return;
      }

      const results = await Promise.allSettled(
        prayerNotifications.map(notif => 
          notifee.cancelNotification(notif.notification.id!)
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`🧹 Cleared ${successCount}/${prayerNotifications.length} prayer notifications`);
    } catch (error) {
      console.error('❌ Failed to clear prayer notifications:', error);
      throw error;
    }
  }

  static async clearOldNotifications(cutoffDate: Date): Promise<void> {
    try {
      const existingNotifications = await notifee.getTriggerNotifications();
      let clearedCount = 0;
      let errorCount = 0;

      for (const notification of existingNotifications) {
        if (notification.trigger.timestamp < cutoffDate.getTime()) {
          try {
            await notifee.cancelNotification(notification.notification.id!);
            clearedCount++;
          } catch (error) {
            errorCount++;
            console.error(`❌ Failed to clear notification ${notification.notification.id}:`, error);
          }
        }
      }

      console.log(`🧹 Cleared ${clearedCount} old notifications (${errorCount} errors)`);
    } catch (error) {
      console.error('❌ Failed to clear old notifications:', error);
      throw error;
    }
  }

  static async scheduleSystemTrigger(id: string, timestamp: number): Promise<void> {
    try {
      // Validate timestamp is in the future
      if (timestamp <= Date.now()) {
        console.warn(`⚠️ Skipping past system trigger: ${id}`);
        return;
      }

      await notifee.createTriggerNotification(
        {
          id,
          title: '',
          body: '',
          android: {
            channelId: this.systemChannelId!,
            ongoing: false,
            autoCancel: true,
            showTimestamp: false,
            visibility: 0,
            importance: AndroidImportance.LOW,
          },
          ios: {
            sound: "default",
            critical: false,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp, // Local timestamp
        } as Trigger
      );

      const triggerLocal = new Date(timestamp).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' });
      console.log(`📝 Scheduled system trigger: ${id} for ${triggerLocal} (Sri Lanka)`);
    } catch (error) {
      console.error('❌ Failed to schedule system trigger:', error);
      throw error;
    }
  }

  static async getScheduledNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      const prayerNotifications = notifications.filter(notif => 
        notif.notification.id?.includes('-prayer-')
      );

      console.log(`📊 Found ${prayerNotifications.length} scheduled prayer notifications`);
      
      // Debug: Log scheduled notifications with local times
      if (prayerNotifications.length > 0) {
        console.log('📋 Currently Scheduled Notifications (Sri Lanka Time):');
        prayerNotifications.forEach(notif => {
          const triggerTime = new Date(notif.trigger.timestamp).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' });
          console.log(`   ${notif.notification.id}: ${triggerTime}`);
        });
      }
      
      return prayerNotifications;
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Test method specifically for Sri Lanka timezone
  static async testSriLankaNotification(): Promise<void> {
    try {
      console.log('🧪 === Testing Sri Lanka Timezone Notification ===');
      
      await this.initialize();
      
      const now = new Date();
      const testTime = new Date(now.getTime() + 10 * 1000); // 10 seconds from now
      const prayerTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 min from now
      
      console.log(`⏰ Current time (Sri Lanka): ${now.toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`);
      console.log(`📅 Test notification scheduled for: ${testTime.toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`);
      console.log(`🕌 Mock prayer time: ${prayerTime.toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`);
      
      const testNotification: PrayerNotification = {
        id: `test-sri-lanka-${Date.now()}`,
        prayer: 'fajr' as PrayerName,
        originalTime: prayerTime,
        notificationTime: testTime,
        date: new Date()
      };

      await this.scheduleNotification(testNotification);
      
      console.log('✅ Sri Lanka timezone test notification scheduled!');
      console.log('📱 Watch for notification in 10 seconds...');
      
      // Clean up after 15 seconds
      setTimeout(async () => {
        try {
          await notifee.cancelNotification(testNotification.id);
          console.log('🧹 Cleaned up test notification');
        } catch (error) {
          console.error('⚠️ Failed to clean up test notification:', error);
        }
      }, 15000);
      
    } catch (error) {
      console.error('❌ Sri Lanka test notification failed:', error);
      throw error;
    }
  }

  // Keep your existing debug and test methods...
  static async debugNotificationStatus(): Promise<void> {
    try {
      console.log('🔍 === Notification Debug Info ===');
      
      const settings = await notifee.getNotificationSettings();
      console.log('Permission status:', settings.authorizationStatus);
      
      const channels = await notifee.getChannels();
      console.log('Available channels:', channels.map(c => ({ id: c.id, name: c.name })));
      
      const scheduled = await notifee.getTriggerNotifications();
      console.log('Scheduled notifications count:', scheduled.length);
      
      if (Platform.OS === 'android') {
        const batteryOptEnabled = await notifee.isBatteryOptimizationEnabled();
        console.log('Battery optimization enabled:', batteryOptEnabled);
      }
      
      console.log('🔍 === End Debug Info ===');
    } catch (error) {
      console.error('❌ Failed to get debug info:', error);
    }
  }

  static async testImmediateNotification(): Promise<void> {
    try {
      console.log('🧪 Testing immediate notification...');
      
      await this.initialize();
      
      await notifee.displayNotification({
        id: `immediate-test-${Date.now()}`,
        title: '🧪 Immediate Test Notification',
        body: 'If you see this, notifications are working!',
        android: {
          channelId: this.prayerChannelId!,
          color: '#2E7D32',
          vibrationPattern: [300, 500, 300, 500],
          importance : AndroidImportance.HIGH,
          autoCancel: true,
        },
        ios: {
          sound: "default",
        },
      });
      
      console.log('✅ Immediate notification sent! Check your notification panel.');
      
    } catch (error) {
      console.error('❌ Immediate test notification failed:', error);
      throw error;
    }
  }
}

export default NotificationService;
