import notifee, { 
  AndroidImportance, 
  TriggerType, 
  AuthorizationStatus,
  Trigger
} from '@notifee/react-native';
import { NOTIFICATION_CHANNELS, PRAYER_DISPLAY_NAMES, formatTime } from '../../utils/helpers';
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
          // Optionally guide user to disable battery optimization
          // await notifee.openBatteryOptimizationSettings();
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
      // Prayer reminders channel - FIXED: Removed custom sound and icon references
      this.prayerChannelId = await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.PRAYER_REMINDERS,
        name: 'Prayer Time Reminders',
        description: 'Notifications for prayer times',
        importance: AndroidImportance.HIGH,
        sound: 'default', // Use system default sound
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

  static async scheduleNotification(notification: PrayerNotification): Promise<void> {
    try {
      const { id, prayer, originalTime, notificationTime, date } = notification;

      // Validate notification time is in the future
      const now = new Date();
      if (notificationTime.getTime() <= now.getTime()) {
        console.warn(`⚠️ Skipping past notification: ${id} scheduled for ${notificationTime}`);
        return;
      }

      // FIXED: Simplified notification without custom resources
      await notifee.createTriggerNotification(
        {
          id,
          title: ` ${PRAYER_DISPLAY_NAMES[prayer as PrayerName]}`,
          body: `Prayer time in 15 minutes • ${formatTime(originalTime)}`,
          android: {
            channelId: this.prayerChannelId!,
            color: '#2E7D32',
            vibrationPattern: [300, 500, 300, 500],
            showTimestamp: true,
            timestamp: notificationTime.getTime(),
            autoCancel: true,
            ongoing: false,
            // Add priority for better delivery
            importance: AndroidImportance.HIGH,
          },
          ios: {
            sound: "default", // Use default system sound
            critical: false,
            categoryId: 'prayer-reminder',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationTime.getTime(),
          // Add repeat options if needed
          // repeatFrequency: RepeatFrequency.DAILY,
        } as Trigger
      );

      console.log(`📝 Scheduled notification: ${id} for ${notificationTime.toISOString()}`);
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
      
      // Filter out past notifications
      const now = new Date();
      const futureNotifications = notifications.filter(
        notif => notif.notificationTime.getTime() > now.getTime()
      );

      if (futureNotifications.length !== notifications.length) {
        console.warn(`⚠️ Filtered out ${notifications.length - futureNotifications.length} past notifications`);
      }

      const batchSize = 20; // Reduced batch size for better stability
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

        // Longer delay between batches for stability
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
        // Don't change this logic as requested
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
            visibility: 0, // Private
            importance: AndroidImportance.LOW,
          },
          ios: {
            sound: "default",
            critical: false,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp,
        } as Trigger
      );

      console.log(`📝 Scheduled system trigger: ${id} for ${new Date(timestamp).toISOString()}`);
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
      return prayerNotifications;
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // ADDED: Debug method to help troubleshoot
  static async debugNotificationStatus(): Promise<void> {
    try {
      console.log('🔍 === Notification Debug Info ===');
      
      // Check permissions
      const settings = await notifee.getNotificationSettings();
      console.log('Permission status:', settings.authorizationStatus);
      
      // Check channels
      const channels = await notifee.getChannels();
      console.log('Available channels:', channels.map(c => ({ id: c.id, name: c.name })));
      
      // Check scheduled notifications
      const scheduled = await notifee.getTriggerNotifications();
      console.log('Scheduled notifications count:', scheduled.length);
      
      // Check battery optimization (Android only)
      if (Platform.OS === 'android') {
        const batteryOptEnabled = await notifee.isBatteryOptimizationEnabled();
        console.log('Battery optimization enabled:', batteryOptEnabled);
      }
      
      console.log('🔍 === End Debug Info ===');
    } catch (error) {
      console.error('❌ Failed to get debug info:', error);
    }
  }

  
  // ADDED: Test function to schedule notification in 5 seconds
  static async testNotificationIn5Seconds(): Promise<void> {
    try {
      console.log('🧪 === Starting 5-Second Notification Test ===');
      
      // First, ensure the service is initialized
      await this.initialize();
      
      // Show debug info
      await this.debugNotificationStatus();
      
      // Create test notification 5 seconds from now
      const testTime = new Date(Date.now() + 5000); // 5 seconds from now
      const originalTime = new Date(Date.now() + 20 * 60 * 1000); // Mock original prayer time (20 min from now)
      
      const testNotification: PrayerNotification = {
        id: `test-prayer-${Date.now()}`,
        prayer: 'fajr' as PrayerName,
        originalTime: originalTime,
        notificationTime: testTime,
        date: new Date()
      };

      console.log(`📅 Scheduling test notification for: ${testTime.toLocaleTimeString()}`);
      console.log(`⏰ Current time: ${new Date().toLocaleTimeString()}`);
      
      // Schedule the test notification
      await this.scheduleNotification(testNotification);
      
      // Verify it was scheduled
      const scheduledNotifications = await this.getScheduledNotifications();
      const testNotif = scheduledNotifications.find(n => n.notification.id === testNotification.id);
      
      if (testNotif) {
        console.log('✅ Test notification scheduled successfully!');
        console.log(`📱 Watch for notification in 5 seconds: "${testNotif.notification.title}"`);
        console.log(`🔔 Notification body: "${testNotif.notification.body}"`);
        
        // Set a timeout to check if notification triggered (this won't catch the actual trigger, but helps with logging)
        setTimeout(async () => {
          console.log('⏰ 5 seconds passed - notification should have triggered!');
          console.log('💡 If you didn\'t see the notification, check:');
          console.log('   - App notifications are enabled in system settings');
          console.log('   - Battery optimization is disabled for this app');
          console.log('   - Do Not Disturb is not blocking notifications');
          
          // Clean up test notification
          try {
            await notifee.cancelNotification(testNotification.id);
            console.log('🧹 Cleaned up test notification');
          } catch (error) {
            console.error('⚠️ Failed to clean up test notification:', error);
          }
        }, 6000);
        
      } else {
        console.error('❌ Test notification was not found in scheduled notifications!');
      }
      
      console.log('🧪 === Test Setup Complete ===');
      
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      throw error;
    }
  }

  // ADDED: Immediate test notification (shows instantly)
  static async testImmediateNotification(): Promise<void> {
    try {
      console.log('🧪 Testing immediate notification...');
      
      await this.initialize();
      
      // Show immediate notification (not scheduled)
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
          sound: "default", // Use default system sound
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