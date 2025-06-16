import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedNotificationService from './UnifiedNotificationService';
import UserPreferencesService from './UserPreferencesService';

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

    // Initialize services in parallel for better performance
    const [notificationService, preferencesService] = await Promise.all([
      UnifiedNotificationService.getInstance()
        .initialize()
        .then(() => UnifiedNotificationService.getInstance()),
      UserPreferencesService.getInstance(),
    ]);

    // Initialize user preferences if needed
    await preferencesService.initializeDefaultSettings(uid);

    const today = new Date().toISOString().split('T')[0];
    await notificationService.scheduleDailyPrayerNotifications(uid, today);

    console.log(`✅ Notification services initialized for user ${uid}`);
  } catch (error) {
    console.error('❌ Error initializing notification services:', error);
    // Don't throw here to prevent cascading failures
  }
};

/**
 * Check if background tasks are healthy
 */
export const checkBackgroundTasksHealth = async (
  uid: number,
): Promise<boolean> => {
  try {
    const lastInit = await AsyncStorage.getItem(
      `notification_services_init_${uid}`,
    );

    if (!lastInit) {
      return false;
    }

    const lastInitTime = parseInt(lastInit);
    const now = Date.now();
    const hoursSinceInit = (now - lastInitTime) / (1000 * 60 * 60);

    // Consider healthy if initialized within last 24 hours
    return hoursSinceInit < 24;
  } catch (error) {
    console.error('Error checking background task health:', error);
    return false;
  }
};

