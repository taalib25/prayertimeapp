import {useState, useEffect, useCallback} from 'react';
import {AppState} from 'react-native';
import {
  getRecentDailyTasks,
  updatePrayerStatus,
  updateSpecialTaskStatus,
  updateZikrCount,
  checkAndCreateTodayTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';
import {checkBackgroundTasksHealth} from '../services/backgroundTasks';

interface UseRecentDailyTasksProps {
  uid: number;
  daysBack?: number;
}

export const useRecentDailyTasks = ({
  uid,
  daysBack = 3,
}: UseRecentDailyTasksProps) => {
  const [recentTasks, setRecentTasks] = useState<DailyTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Only check and create today's tasks if they don't exist
      await checkAndCreateTodayTasks(uid);

      // Ensure notification services are healthy
      await checkBackgroundTasksHealth(uid);

      const tasks = await getRecentDailyTasks(uid, daysBack);

      // Sort tasks by date (newest first) for proper display order
      const sortedTasks = tasks.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setRecentTasks(sortedTasks);
    } catch (err) {
      setError('Failed to fetch recent daily tasks');
      console.error('Error fetching recent daily tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, daysBack]);

  const toggleSpecialTaskForDate = useCallback(
    async (date: string, taskId: string) => {
      const today = new Date().toISOString().split('T')[0];

      // Prevent toggling tasks for previous days
      if (date !== today) {
        console.log('Cannot toggle tasks for previous days');
        return;
      }

      const dayTasks = recentTasks.find(task => task.date === date);
      if (!dayTasks) return;

      const task = dayTasks.specialTasks.find(t => t.id === taskId);
      if (!task) return;

      try {
        await updateSpecialTaskStatus(uid, date, taskId, !task.completed);
        await fetchRecentTasks();
      } catch (err) {
        console.error('Error toggling special task:', err);
        setError('Failed to update task');
      }
    },
    [uid, recentTasks, fetchRecentTasks],
  );

  const updatePrayerForDate = useCallback(
    async (date: string, prayerName: string, status: PrayerStatus) => {
      const today = new Date().toISOString().split('T')[0];

      // Prevent updating prayers for previous days
      if (date !== today) {
        console.log('Cannot update prayers for previous days');
        return;
      }

      try {
        await updatePrayerStatus(uid, date, prayerName, status);
        await fetchRecentTasks();
      } catch (err) {
        console.error('Error updating prayer:', err);
        setError('Failed to update prayer status');
      }
    },
    [uid, fetchRecentTasks],
  );

  const updateZikrForDate = useCallback(
    async (date: string, count: number) => {
      const today = new Date().toISOString().split('T')[0];

      // Prevent updating zikr for previous days
      if (date !== today) {
        console.log('Cannot update zikr for previous days');
        return;
      }

      try {
        await updateZikrCount(uid, date, count);
        await fetchRecentTasks();
      } catch (err) {
        console.error('Error updating zikr:', err);
        setError('Failed to update zikr count');
      }
    },
    [uid, fetchRecentTasks],
  );

  useEffect(() => {
    fetchRecentTasks();
  }, [fetchRecentTasks]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        fetchRecentTasks(); // This will create today's tasks if needed
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
    };
  }, [fetchRecentTasks]);

  return {
    recentTasks,
    isLoading,
    error,
    toggleSpecialTaskForDate,
    updatePrayerForDate,
    updateZikrForDate,
    refetch: fetchRecentTasks,
  };
};
