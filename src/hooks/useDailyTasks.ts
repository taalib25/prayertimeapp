import {useState, useEffect, useCallback} from 'react';
import {AppState} from 'react-native';
import {
  getRecentDailyTasks,
  updatePrayerStatus,
  updateSpecialTaskStatus,
  updateZikrCount,
  updateQuranPages,
  checkAndCreateTodayTasks,
  getRecentMonthsData,
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

      // console.log('🔄 Starting fetchRecentTasks...');

      // Only check and create TODAY's tasks if they don't exist
      const today = new Date().toISOString().split('T')[0];
      console.log(`📅 Today is: ${today}`);

      await checkAndCreateTodayTasks(uid);

      // Ensure notification services are healthy (don't recreate tasks)
      await checkBackgroundTasksHealth(uid);

      // Fetch recent tasks (this will NOT create tasks, just fetch existing ones)
      const tasks = await getRecentDailyTasks(uid, daysBack);

      console.log(`📊 Fetched ${tasks.length} recent task records`);

      // Sort tasks by date (newest first) for proper display order
      const sortedTasks = tasks.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Log the task data for debugging
      sortedTasks.forEach(task => {
        console.log(
          `📋 ${task.date}: ${task.specialTasks.length} special tasks`,
        );
      });

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

  const updateQuranForDate = useCallback(
    async (date: string, pages: number) => {
      const today = new Date().toISOString().split('T')[0];

      // Prevent updating Quran for previous days
      if (date !== today) {
        console.log('Cannot update Quran for previous days');
        return;
      }

      try {
        await updateQuranPages(uid, date, pages);
        await fetchRecentTasks();
      } catch (err) {
        console.error('Error updating Quran:', err);
        setError('Failed to update Quran pages');
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
        console.log("🔄 App became active, checking for today's tasks only...");
        // Only check for today's tasks, don't recreate everything
        fetchRecentTasks();
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
    updateQuranForDate,
    refetch: fetchRecentTasks,
  };
};

/**
 * Hook for monthly aggregated data
 */
export const useMonthlyData = ({
  uid,
  monthsBack = 3,
}: {
  uid: number;
  monthsBack?: number;
}) => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 Fetching monthly aggregated data...');
      const data = await getRecentMonthsData(uid, monthsBack);
      setMonthlyData(data);
    } catch (err) {
      setError('Failed to fetch monthly data');
      console.error('Error fetching monthly data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, monthsBack]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return {
    monthlyData,
    isLoading,
    error,
    refetch: fetchMonthlyData,
  };
};
