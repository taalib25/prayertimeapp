import {useState, useEffect, useCallback, useRef} from 'react';
import {AppState} from 'react-native';
import {
  getRecentDailyTasks,
  updatePrayerStatus,
  updateZikrCount,
  updateQuranMinutes,
  checkAndCreateTodayTasks,
  DailyTaskData,
  getRecentMonthsData,
} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';

interface UseRecentDailyTasksProps {
  daysBack?: number;
}

export const useRecentDailyTasks = ({
  daysBack = 3,
}: UseRecentDailyTasksProps = {}) => {
  const [recentTasks, setRecentTasks] = useState<DailyTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger
  const isUpdatingRef = useRef(false); // Prevent concurrent updates

  const fetchRecentTasks = useCallback(
    async (skipLog = false) => {
      try {
        if (!skipLog) {
          console.log('🔄 Hook: Starting fetchRecentTasks...');
        }

        setIsLoading(true);
        setError(null);

        // Check and create today's tasks if needed
        await checkAndCreateTodayTasks();

        // Fetch recent tasks
        const tasks = await getRecentDailyTasks(daysBack);

        if (!skipLog) {
          console.log(`📋 Hook: Received ${tasks.length} daily tasks`);
        }

        // Enhanced logging for today's task
        if (tasks.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayTask = tasks.find(t => t.date === today);
          if (todayTask) {
            if (!skipLog) {
              console.log("📅 Hook: Today's task found:", {
                date: todayTask.date,
                fajr: todayTask.fajrStatus,
                dhuhr: todayTask.dhuhrStatus,
                asr: todayTask.asrStatus,
                maghrib: todayTask.maghribStatus,
                isha: todayTask.ishaStatus,
              });
            }
          } else {
            console.log('❌ Hook: No task found for today:', today);
            console.log(
              '❌ Hook: Available dates:',
              tasks.map(t => t.date),
            );
          }
        } else {
          console.log('❌ Hook: No tasks found at all');
        }

        // Update state with new data
        setRecentTasks(tasks);

        if (!skipLog) {
          console.log('✅ Hook: State updated with new tasks');
        }

        return tasks; // Return the fetched tasks
      } catch (err) {
        setError('Failed to fetch recent daily tasks');
        console.error('❌ Hook: Error fetching recent daily tasks:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [daysBack],
  );

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Hook: Force refresh triggered');
    setRefreshKey(prev => prev + 1);
    await fetchRecentTasks();
  }, [fetchRecentTasks]);

  const updatePrayerForDate = useCallback(
    async (date: string, prayerName: string, status: PrayerStatus) => {
      // Prevent concurrent updates
      if (isUpdatingRef.current) {
        console.log('⏸️ Hook: Update already in progress, skipping...');
        return;
      }

      isUpdatingRef.current = true;

      try {
        console.log(`🎯 Hook: updatePrayerForDate called`);
        console.log(`   Date: ${date}`);
        console.log(`   Prayer: ${prayerName}`);
        console.log(`   Status: ${status}`);

        const today = new Date().toISOString().split('T')[0];

        // Only allow updating today's prayers
        if (date !== today) {
          console.log('❌ Hook: Cannot update prayers for previous days');
          return;
        }

        // Enforce lowercase for consistency
        const lcPrayer = prayerName.toLowerCase();

        // Validate prayer name
        if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(lcPrayer)) {
          console.error(`❌ Hook: Invalid prayer name: ${prayerName}`);
          return;
        }

        console.log(`🔧 Hook: Calling updatePrayerStatus...`);

        // Call the database update function
        await updatePrayerStatus(date, lcPrayer, status);

        console.log(
          `🔄 Hook: Database update completed, now refreshing data...`,
        );

        // Wait a bit to ensure database write is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force refresh the tasks data
        await forceRefresh();

        console.log(`✅ Hook: Complete flow finished successfully`);
      } catch (err) {
        console.error('❌ Hook: Error in updatePrayerForDate:', err);
        setError('Failed to update prayer status');
        throw err;
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [forceRefresh],
  );
  const updateZikrForDate = useCallback(
    async (date: string, count: number) => {
      if (isUpdatingRef.current) {
        console.log('⏸️ Hook: Zikr update already in progress, skipping...');
        return;
      }

      isUpdatingRef.current = true;

      try {
        const today = new Date().toISOString().split('T')[0];

        // Only allow updating today's zikr
        if (date !== today) {
          console.log('Cannot update zikr for previous days');
          return;
        }

        await updateZikrCount(date, count);
        await forceRefresh();
      } catch (err) {
        console.error('Error updating zikr:', err);
        setError('Failed to update zikr count');
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [forceRefresh],
  );

  const updateQuranForDate = useCallback(
    async (date: string, minutes: number) => {
      if (isUpdatingRef.current) {
        console.log('⏸️ Hook: Quran update already in progress, skipping...');
        return;
      }

      isUpdatingRef.current = true;

      try {
        const today = new Date().toISOString().split('T')[0];

        // Only allow updating today's Quran minutes
        if (date !== today) {
          console.log('Cannot update Quran for previous days');
          return;
        }

        await updateQuranMinutes(date, minutes);
        await forceRefresh();
      } catch (err) {
        console.error('Error updating Quran:', err);
        setError('Failed to update Quran minutes');
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [forceRefresh],
  );

  // Initial load
  useEffect(() => {
    fetchRecentTasks();
  }, [fetchRecentTasks, refreshKey]);

  // App state change listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        forceRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
    };
  }, [forceRefresh]);

  return {
    recentTasks,
    isLoading,
    error,
    updatePrayerForDate,
    updateZikrForDate,
    updateQuranForDate,
    fetchRecentTasks,
    refetch: forceRefresh, // Use forceRefresh instead of fetchRecentTasks
    forceRefresh, // Expose force refresh specifically
  };
};

/**
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

// (Removed duplicate and broken code for useMonthlyData.)
// If you want to keep the monthly data hook, ensure only the correct implementation remains below.
// Also, make sure getRecentMonthsData is imported if you use it, e.g.:
// import { getRecentMonthsData } from '../services/db/dailyTaskServices';
// Also, make sure getRecentMonthsData is imported if you use it, e.g.:
// import { getRecentMonthsData } from '../services/db/dailyTaskServices';
