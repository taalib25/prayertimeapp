import {useState, useEffect, useCallback} from 'react';
import {
  getDailyTasksForDate,
  updatePrayerStatus,
  updateSpecialTaskStatus,
  updateZikrCount,
  checkAndResetDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTasks';
import {PrayerStatus} from '../model/DailyTasks';

interface UseDailyTasksProps {
  uid: number;
  date: string;
}

export const useDailyTasks = ({uid, date}: UseDailyTasksProps) => {
  const [dailyTasks, setDailyTasks] = useState<DailyTaskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check and reset if it's a new day
      await checkAndResetDailyTasks(uid);

      const tasks = await getDailyTasksForDate(uid, date);
      // console.log("tasks", tasks)
      setDailyTasks(tasks);
    } catch (err) {
      setError('Failed to fetch daily tasks');
      console.error('Error fetching daily tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, date]);

  const updatePrayer = useCallback(
    async (prayerName: string, status: PrayerStatus) => {
      try {
        await updatePrayerStatus(uid, date, prayerName, status);
        await fetchDailyTasks(); // Refresh data
      } catch (err) {
        console.error('Error updating prayer:', err);
        setError('Failed to update prayer status');
      }
    },
    [uid, date, fetchDailyTasks],
  );

  const toggleSpecialTask = useCallback(
    async (taskId: string) => {
      if (!dailyTasks) return;

      const task = dailyTasks.specialTasks.find(t => t.id === taskId);
      if (!task) return;

      try {
        await updateSpecialTaskStatus(uid, date, taskId, !task.completed);
        await fetchDailyTasks(); // Refresh data
      } catch (err) {
        console.error('Error toggling special task:', err);
        setError('Failed to update task');
      }
    },
    [uid, date, dailyTasks, fetchDailyTasks],
  );

  const updateZikr = useCallback(
    async (count: number) => {
      try {
        await updateZikrCount(uid, date, count);
        await fetchDailyTasks(); // Refresh data
      } catch (err) {
        console.error('Error updating zikr:', err);
        setError('Failed to update zikr count');
      }
    },
    [uid, date, fetchDailyTasks],
  );

  useEffect(() => {
    fetchDailyTasks();
  }, [fetchDailyTasks]);

  // Auto-refresh at start of new day
  
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      fetchDailyTasks(); // Refresh at midnight
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [fetchDailyTasks]);

  return {
    dailyTasks,
    isLoading,
    error,
    updatePrayer,
    toggleSpecialTask,
    updateZikr,
    refetch: fetchDailyTasks,
  };
};
