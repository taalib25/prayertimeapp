import notifee, { 
  AndroidImportance, 
  TriggerType, 
  AuthorizationStatus,
  Trigger
} from '@notifee/react-native';
import { NOTIFICATION_CHANNELS, PRAYER_DISPLAY_NAMES, formatTime } from '../../utils/helpers';
import { PrayerNotification, PrayerName } from '../../utils/types';
class NotificationService {
  private static prayerChannelId: string | null = null;
  private static systemChannelId: string | null = null;

  static async initialize(): Promise<void> {
    try {
      // Request permission
      const settings = await notifee.requestPermission();
      
      if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        throw new Error('Notification permission denied');
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
    // Prayer reminders channel
    this.prayerChannelId = await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.PRAYER_REMINDERS,
      name: 'Prayer Time Reminders',
      description: 'Notifications for prayer times',
      importance: AndroidImportance.HIGH,
      sound: 'prayer_adhan', // Custom sound file
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
    });

    // System channel for triggers
    this.systemChannelId = await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.PRAYER_SYSTEM,
      name: 'Prayer System',
      description: 'System notifications for prayer updates',
      importance: AndroidImportance.LOW,
      sound: undefined,
      vibration: false,
    });
  }

  static async scheduleNotification(notification: PrayerNotification): Promise<void> {
    try {
      const { id, prayer, originalTime, notificationTime, date } = notification;

      await notifee.createTriggerNotification(
        {
          id,
          title: `🕌 ${PRAYER_DISPLAY_NAMES[prayer as PrayerName]} Prayer Time`,
          body: `Prayer time in 15 minutes • ${formatTime(originalTime)}`,
          android: {
            channelId: this.prayerChannelId!,
            smallIcon: 'prayer_icon',
            color: '#2E7D32',
            sound: 'prayer_adhan',
            vibrationPattern: [300, 500, 300, 500],
            showTimestamp: true,
            timestamp: notificationTime.getTime(),
          },
          ios: {
            sound: 'prayer_adhan.wav',
            critical: false,
            categoryId: 'prayer-reminder',
            attachments: [],
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationTime.getTime(),
        } as Trigger
      );
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  static async batchScheduleNotifications(notifications: PrayerNotification[]): Promise<number> {
    try {
      console.log(`📅 Scheduling ${notifications.length} prayer notifications...`);
      
      const batchSize = 50;
      let scheduledCount = 0;

      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (notif) => {
            await this.scheduleNotification(notif);
            scheduledCount++;
          })
        );

        // Small delay between batches
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Successfully scheduled ${scheduledCount} notifications`);
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

      await Promise.all(
        prayerNotifications.map(notif => 
          notifee.cancelNotification(notif.notification.id!)
        )
      );

      console.log(`🧹 Cleared ${prayerNotifications.length} prayer notifications`);
    } catch (error) {
      console.error('❌ Failed to clear prayer notifications:', error);
      throw error;
    }
  }

  static async clearOldNotifications(cutoffDate: Date): Promise<void> {
    try {
      const existingNotifications = await notifee.getTriggerNotifications();
      let clearedCount = 0;

      for (const notification of existingNotifications) {
        //dont change this
        if (notification.trigger.timestamp < cutoffDate.getTime()) {
          await notifee.cancelNotification(notification.notification.id!);
          clearedCount++;
        }
      }

      console.log(`🧹 Cleared ${clearedCount} old notifications`);
    } catch (error) {
      console.error('❌ Failed to clear old notifications:', error);
      throw error;
    }
  }

  static async scheduleSystemTrigger(id: string, timestamp: number): Promise<void> {
    try {
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
          },
          ios: {
            sound: undefined,
            critical: false,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp,
        } as Trigger
      );
    } catch (error) {
      console.error('❌ Failed to schedule system trigger:', error);
      throw error;
    }
  }

  static async getScheduledNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications.filter(notif => 
        notif.notification.id?.includes('-prayer-')
      );
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }
}

export default NotificationService;
