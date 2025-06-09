import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedNotificationService from './UnifiedNotificationService';

/**
 * Initialize notification services for a user
 */
export const initializeUserBackgroundTasks = async (
  uid: number,
): Promise<void> => {
  try {
    console.log(`🔄 Initializing notification services for user ${uid}...`);

    // Initialize unified notification service
    const notificationService = UnifiedNotificationService.getInstance();
    const today = new Date().toISOString().split('T')[0];
    await notificationService.scheduleDailyPrayerNotifications(uid, today);

    // Store last initialization time
    await AsyncStorage.setItem(
      `notification_services_init_${uid}`,
      Date.now().toString(),
    );

    console.log(`✅ Notification services initialized for user ${uid}`);
  } catch (error) {
    console.error('Error initializing notification services:', error);
  }
};

/**
 * Check if notification services need to be reinitialized
 */
export const checkBackgroundTasksHealth = async (
  uid: number,
): Promise<boolean> => {
  try {
    const lastInit = await AsyncStorage.getItem(
      `notification_services_init_${uid}`,
    );
    if (!lastInit) return false;

    const daysSinceInit =
      (Date.now() - parseInt(lastInit)) / (24 * 60 * 60 * 1000);

    // Reinitialize if more than 7 days since last init
    if (daysSinceInit > 7) {
      await initializeUserBackgroundTasks(uid);
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error checking notification services health:', error);
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
