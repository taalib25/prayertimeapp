import {
  updatePrayerStatus,
  getRecentDailyTasks,
} from '../../services/db/dailyTaskServices';
import {PrayerStatus} from '../../model/DailyTasks';
import {EnhancedSpecialTask, TaskCategory} from './specialTasks';

// Optional callback type for UI refresh
type RefreshCallback = () => Promise<void>;

/**
 * Get current values for a specific date
 */
const getCurrentTaskData = async (dateISO: string) => {
  try {
    const recentTasks = await getRecentDailyTasks(7); // Get last 7 days
    const taskForDate = recentTasks.find(task => task.date === dateISO);

    return {
      quranMinutes: taskForDate?.quranMinutes || 0,
      zikrCount: taskForDate?.totalZikrCount || 0,
    };
  } catch (error) {
    console.error('Error getting current task data:', error);
    return {
      quranMinutes: 0,
      zikrCount: 0,
    };
  }
};

/**
 * Handle task completion based on category and update database accordingly
 * This is a TOGGLE function that determines current state and switches it
 */
export const handleTaskCompletion = async (
  task: EnhancedSpecialTask,
  dateISO: string,
  refreshCallback?: RefreshCallback, // Optional callback to refresh UI context
  forceCompleted?: boolean, // Optional: force a specific state
): Promise<void> => {
  try {
    console.log(`🔧 Handling task toggle: ${task.title}`);

    // Get current data for this date
    const currentData = await getCurrentTaskData(dateISO);

    switch (task.category) {
      case 'prayer':
        if (task.prayerName) {
          // For prayers, toggle between 'mosque' and 'none'
          // Check current status
          const recentTasks = await getRecentDailyTasks(7);
          const taskForDate = recentTasks.find(t => t.date === dateISO);
          const currentStatus =
            taskForDate?.[
              `${task.prayerName}Status` as keyof typeof taskForDate
            ];

          const newStatus: PrayerStatus =
            currentStatus === 'mosque' || currentStatus === 'home'
              ? 'none'
              : 'mosque';
          await updatePrayerStatus(dateISO, task.prayerName, newStatus);
          console.log(`✅ Prayer ${task.prayerName} toggled to: ${newStatus}`);

          // Call refresh callback if provided
          if (refreshCallback) {
            await refreshCallback();
          }
        }
        break;

      case 'quran':
        // For Quran: toggle between adding and removing the amount
        const currentQuranMinutes = currentData.quranMinutes;
        const isCurrentlyCompleted = currentQuranMinutes >= task.amount;

        const newQuranMinutes = isCurrentlyCompleted
          ? Math.max(0, currentQuranMinutes - task.amount) // Remove amount (toggle OFF)
          : currentQuranMinutes + task.amount; // Add amount (toggle ON)        await updateQuranMinutes(dateISO, newQuranMinutes);
        console.log(
          `✅ Quran minutes toggled from ${currentQuranMinutes} to: ${newQuranMinutes}`,
        );

        // Call refresh callback if provided
        if (refreshCallback) {
          await refreshCallback();
        }
        break;

      case 'zikr':
        // For Zikr: toggle between adding and removing the amount
        const currentZikrCount = currentData.zikrCount;
        const isZikrCurrentlyCompleted = currentZikrCount >= task.amount;

        const newZikrCount = isZikrCurrentlyCompleted
          ? Math.max(0, currentZikrCount - task.amount) // Remove amount (toggle OFF)
          : currentZikrCount + task.amount; // Add amount (toggle ON)        await updateZikrCount(dateISO, newZikrCount);
        console.log(
          `✅ Zikr count toggled from ${currentZikrCount} to: ${newZikrCount}`,
        );

        // Call refresh callback if provided
        if (refreshCallback) {
          await refreshCallback();
        }
        break;

      default:
        console.warn(`⚠️ Unknown task category: ${task.category}`);
    }
  } catch (error) {
    console.error(`❌ Error handling task toggle for ${task.title}:`, error);
    throw error;
  }
};

/**
 * Batch handle multiple task completions
 */
export const handleBatchTaskCompletion = async (
  tasks: EnhancedSpecialTask[],
  dateISO: string,
): Promise<void> => {
  try {
    const promises = tasks.map(task => handleTaskCompletion(task, dateISO));
    await Promise.all(promises);
    console.log(`✅ Batch toggled ${tasks.length} tasks`);
  } catch (error) {
    console.error('❌ Error in batch task completion:', error);
    throw error;
  }
};
