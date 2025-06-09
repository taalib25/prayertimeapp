import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedNotificationService from './UnifiedNotificationService';

/**
 * Initialize notification services for a user
 */
export const initializeUserBackgroundTasks = async (
  uid: number,
): Promise<void> => {
  try {
    if (!uid || isNaN(uid)) {
      throw new Error('Invalid user ID provided');
    }

    console.log(`🔄 Initializing notification services for user ${uid}...`);

    // Initialize unified notification service
    const notificationService = UnifiedNotificationService.getInstance();
    await notificationService.initialize();

    const today = new Date().toISOString().split('T')[0];
    await notificationService.scheduleDailyPrayerNotifications(uid, today);

    // Store last initialization time
    await AsyncStorage.setItem(
      `notification_services_init_${uid}`,
      Date.now().toString(),
    );

    console.log(`✅ Notification services initialized for user ${uid}`);
  } catch (error) {
    console.error('❌ Error initializing notification services:', error);
    // Don't throw here to prevent cascading failures
  }
};

/**
 * Reschedule notifications after settings change
 */
export const rescheduleNotificationsForUser = async (
  uid: number,
): Promise<void> => {
  try {
    if (!uid || isNaN(uid)) {
      throw new Error('Invalid user ID provided');
    }

    console.log(`🔄 Rescheduling notifications for user ${uid}...`);

    const notificationService = UnifiedNotificationService.getInstance();
    const today = new Date().toISOString().split('T')[0];
    await notificationService.scheduleDailyPrayerNotifications(uid, today);

    console.log(`✅ Notifications rescheduled for user ${uid}`);
  } catch (error) {
    console.error('❌ Error rescheduling notifications:', error);
  }
};

/**
 * Check if notification services need to be reinitialized
 */
export const checkBackgroundTasksHealth = async (
  uid: number,
): Promise<boolean> => {
  try {
    if (!uid || isNaN(uid)) {
      console.error('Invalid user ID provided for health check');
      return false;
    }

    const lastInit = await AsyncStorage.getItem(
      `notification_services_init_${uid}`,
    );
    if (!lastInit) {
      console.log(
        `No initialization record found for user ${uid}, initializing notifications only...`,
      );
      await initializeUserBackgroundTasks(uid);
      return true;
    }

    const daysSinceInit =
      (Date.now() - parseInt(lastInit)) / (24 * 60 * 60 * 1000);

    // Reinitialize if more than 7 days since last init
    if (daysSinceInit > 7) {
      console.log(
        `Notifications expired for user ${uid}, reinitializing notifications only...`,
      );
      await initializeUserBackgroundTasks(uid);
      return true;
    }

    console.log(
      `Notification services healthy for user ${uid} (${daysSinceInit.toFixed(
        1,
      )} days since init)`,
    );
    return true;
  } catch (error) {
    console.error('❌ Error checking notification services health:', error);
    return false;
  }
};

/**
 * Clean up old notification services for a user
 */
export const cleanupUserBackgroundTasks = async (
  uid: number,
): Promise<void> => {
  try {
    // Clear notification service data
    await AsyncStorage.removeItem(`notification_services_init_${uid}`);
    console.log(`🧹 Cleaned up notification services for user ${uid}`);
  } catch (error) {
    console.error('Error cleaning up notification services:', error);
  }
};
