import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedNotificationService from './UnifiedNotificationService';
import UserPreferencesService from './UserPreferencesService';
import PermissionInitializer from './PermissionInitializer';
import {getTodayDateString} from '../utils/helpers';

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

    console.log(`🔄 Initializing background services for user ${uid}...`);

    // 1. Initialize permissions first
    const permissionInitializer = PermissionInitializer.getInstance();
    await permissionInitializer.initializeAppPermissions();

    // 2. Initialize services in parallel for better performance
    const [notificationService, preferencesService] = await Promise.all([
      UnifiedNotificationService.getInstance()
        .initialize()
        .then(() => UnifiedNotificationService.getInstance()),
      UserPreferencesService.getInstance(),
    ]);

    // 3. Initialize user preferences if needed
    await preferencesService.initializeDefaultSettings(uid);

    // 4. Schedule daily prayer notifications
    const today = getTodayDateString();
    await notificationService.scheduleDailyPrayerNotifications(uid, today);

    // 5. Mark as initialized with timestamp
    await AsyncStorage.setItem(
      `notification_services_init_${uid}`,
      Date.now().toString(),
    );

    console.log(`✅ Background services initialized for user ${uid}`);
  } catch (error) {
    console.error('❌ Error initializing background services:', error);
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
