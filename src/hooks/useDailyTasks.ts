import {useState, useEffect, useCallback} from 'react';
import {AppState} from 'react-native';
import {
  getDailyTasksForDate,
  getRecentDailyTasks,
  updatePrayerStatus,
  updateSpecialTaskStatus,
  updateZikrCount,
  checkAndResetDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';
import {
  initializeUserBackgroundTasks,
  checkBackgroundTasksHealth,
} from '../services/backgroundTasks';

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

  // Enhanced auto-refresh system
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const currentDate = new Date().toISOString().split('T')[0];
        if (currentDate !== date) {
          fetchDailyTasks(); // This triggers reset if needed
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
    };
  }, [fetchDailyTasks, date]);

  // Enhanced background task initialization
  useEffect(() => {
    const initializeBackgroundTasks = async () => {
      try {
        // First check and reset daily tasks
        await checkAndResetDailyTasks(uid);

        // Check if background tasks are properly set up
        const isHealthy = await checkBackgroundTasksHealth(uid);

        if (!isHealthy) {
          console.log(`🔄 Setting up background tasks for user ${uid}...`);
          await initializeUserBackgroundTasks(uid);
        }
      } catch (error) {
        console.error('Error initializing background tasks:', error);
      }
    };

    initializeBackgroundTasks();
  }, [uid]);

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

      // Check and reset if it's a new day
      await checkAndResetDailyTasks(uid);

      const tasks = await getRecentDailyTasks(uid, daysBack);
      setRecentTasks(tasks);
    } catch (err) {
      setError('Failed to fetch recent daily tasks');
      console.error('Error fetching recent daily tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, daysBack]);

  const toggleSpecialTaskForDate = useCallback(
    async (date: string, taskId: string) => {
      const dayTasks = recentTasks.find(task => task.date === date);
      if (!dayTasks) return;

      const task = dayTasks.specialTasks.find(t => t.id === taskId);
      if (!task) return;

      try {
        await updateSpecialTaskStatus(uid, date, taskId, !task.completed);
        await fetchRecentTasks(); // Refresh all data
      } catch (err) {
        console.error('Error toggling special task:', err);
        setError('Failed to update task');
      }
    },
    [uid, recentTasks, fetchRecentTasks],
  );

  const updatePrayerForDate = useCallback(
    async (date: string, prayerName: string, status: PrayerStatus) => {
      try {
        await updatePrayerStatus(uid, date, prayerName, status);
        await fetchRecentTasks(); // Refresh all data
      } catch (err) {
        console.error('Error updating prayer:', err);
        setError('Failed to update prayer status');
      }
    },
    [uid, fetchRecentTasks],
  );

  useEffect(() => {
    fetchRecentTasks();
  }, [fetchRecentTasks]);

  // Enhanced auto-refresh system
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        fetchRecentTasks(); // This triggers reset if needed
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
    refetch: fetchRecentTasks,
  };
};
