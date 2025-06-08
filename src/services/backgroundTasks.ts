import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkAndResetDailyTasks,
  checkAndUpdateNotifications,
} from './db/dailyTaskServices';

/**
 * Initialize all background tasks for a user
 */
export const initializeUserBackgroundTasks = async (
  uid: number,
): Promise<void> => {
  try {
    // Schedule daily reset check (every 6 hours to catch missed resets)
    await scheduleRepeatingTask(
      `daily-reset-check-${uid}`,
      6 * 60 * 60 * 1000, // 6 hours
      async () => {
        await checkAndResetDailyTasks(uid);
      },
    );

    // Schedule prayer time check (daily at 12:05 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 12:05 AM

    await BackgroundFetch.scheduleTask({
      taskId: `prayer-check-${uid}-${tomorrow.getTime()}`,
      delay: tomorrow.getTime() - Date.now(),
      periodic: true,
      // IN: 24 * 60 * 60 * 1000, // Daily
      forceAlarmManager: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    });

    // Store last initialization time
    await AsyncStorage.setItem(
      `background_tasks_init_${uid}`,
      Date.now().toString(),
    );

    console.log(`✅ Background tasks initialized for user ${uid}`);
  } catch (error) {
    console.error('Error initializing background tasks:', error);
  }
};

/**
 * Schedule a repeating background task
 */
const scheduleRepeatingTask = async (
  taskId: string,
  interval: number,
  callback: () => Promise<void>,
): Promise<void> => {
  await BackgroundFetch.scheduleTask({
    taskId,
    delay: interval,
    periodic: true,
    // period: interval,
    forceAlarmManager: true,
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
  });
};

/**
 * Check if background tasks need to be reinitialized
 */
export const checkBackgroundTasksHealth = async (
  uid: number,
): Promise<boolean> => {
  try {
    const lastInit = await AsyncStorage.getItem(`background_tasks_init_${uid}`);
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
    console.error('Error checking background tasks health:', error);
    return false;
  }
};

/**
 * Clean up old background tasks for a user
 */
export const cleanupUserBackgroundTasks = async (
  uid: number,
): Promise<void> => {
  try {
    // Stop known task IDs for this user
    const taskIds = [
      `daily-reset-check-${uid}`,
      `prayer-check-${uid}`,
    ];

    let cleanedCount = 0;
    for (const taskId of taskIds) {
      try {
        await BackgroundFetch.stop(taskId);
        cleanedCount++;
      } catch (error) {
        // Task might not exist, continue
      }
    }

    console.log(
      `🧹 Cleaned up ${cleanedCount} background tasks for user ${uid}`,
    );
  } catch (error) {
    console.error('Error cleaning up background tasks:', error);
  }
};
