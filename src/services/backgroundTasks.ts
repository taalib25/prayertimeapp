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
    console.log(`🔄 Initializing background tasks for user ${uid}...`);

    // Configure BackgroundFetch if not already configured
    await configureBackgroundFetch();

    // Schedule daily reset check (every 6 hours to catch missed resets)
    await scheduleRepeatingTask(
      `daily-reset-check-${uid}`,
      6 * 60 * 60 * 1000, // 6 hours
    );

    // Schedule prayer time check (daily at 12:05 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 12:05 AM

    await BackgroundFetch.scheduleTask({
      taskId: `prayer-check-${uid}-${tomorrow.getTime()}`,
      delay: tomorrow.getTime() - Date.now(),
      periodic: true,
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
 * Configure BackgroundFetch (call once per app session)
 */
const configureBackgroundFetch = async (): Promise<void> => {
  try {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15000, // 15 seconds (for testing)
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        forceAlarmManager: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId: string) => {
        console.log(`[BackgroundFetch] Task executed: ${taskId}`);

        try {
          // Handle different task types
          if (taskId.includes('daily-reset')) {
            const uid = extractUidFromTaskId(taskId);
            if (uid) {
              await checkAndResetDailyTasks(uid);
              console.log(`✅ Daily reset completed for user ${uid}`);
            }
          }

          if (taskId.includes('prayer-check')) {
            const uid = extractUidFromTaskId(taskId);
            if (uid) {
              const today = new Date().toISOString().split('T')[0];
              await checkAndUpdateNotifications(uid, today);
              console.log(`✅ Prayer notifications updated for user ${uid}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error in background task ${taskId}:`, error);
        }

        BackgroundFetch.finish(taskId);
      },
      (taskId: string) => {
        console.log(`[BackgroundFetch] Task timeout: ${taskId}`);
        BackgroundFetch.finish(taskId);
      },
    );

    console.log(`📱 BackgroundFetch configured with status: ${status}`);
  } catch (error) {
    console.error('❌ Error configuring BackgroundFetch:', error);
  }
};

/**
 * Extract UID from task ID
 */
const extractUidFromTaskId = (taskId: string): number | null => {
  const match = taskId.match(/-(\d+)(?:-|$)/);
  return match ? parseInt(match[1]) : null;
};

/**
 * Schedule a repeating background task
 */
const scheduleRepeatingTask = async (
  taskId: string,
  interval: number,
): Promise<void> => {
  try {
    await BackgroundFetch.scheduleTask({
      taskId,
      delay: interval,
      periodic: true,
      forceAlarmManager: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    });

    console.log(`📅 Scheduled repeating task: ${taskId}`);
  } catch (error) {
    console.error(`❌ Error scheduling task ${taskId}:`, error);
  }
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
    const taskIds = [`daily-reset-check-${uid}`, `prayer-check-${uid}`];

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
