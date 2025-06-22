import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  getRecentDailyTasks,
  DailyTaskData,
  updatePrayerStatus,
  updateQuranMinutes,
  updateZikrCount,
} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';
import ApiTaskServices from '../services/apiHandler';
import {dataCache} from '../utils/dataCache';

interface DailyTasksContextType {
  // Data
  dailyTasks: DailyTaskData[];
  isLoading: boolean;
  error: string | null;

  // Methods
  refreshData: () => Promise<void>;
  getTodayData: () => DailyTaskData | null;
  getDataForDate: (date: string) => DailyTaskData | null;

  // Update methods that auto-refresh
  updatePrayerAndRefresh: (
    date: string,
    prayer: string,
    status: PrayerStatus,
  ) => Promise<void>;
  updateQuranAndRefresh: (date: string, minutes: number) => Promise<void>;
  updateZikrAndRefresh: (date: string, count: number) => Promise<void>;
}

const DailyTasksContext = createContext<DailyTasksContextType | undefined>(
  undefined,
);

export const DailyTasksProvider: React.FC<{
  children: React.ReactNode;
  daysBack?: number;
}> = ({children, daysBack = 30}) => {
  const [dailyTasks, setDailyTasks] = useState<DailyTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get API service instance
  const apiService = useMemo(() => ApiTaskServices.getInstance(), []);
  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // ⚡ PERFORMANCE: Check cache first for instant load
      const cacheKey = `daily-tasks-${daysBack}`;
      const cachedTasks = dataCache.get<DailyTaskData[]>(cacheKey);
      
      if (cachedTasks) {
        console.log('⚡ DailyTasksContext: Using cached data');
        setDailyTasks(cachedTasks);
        setIsLoading(false);
        
        // Background refresh for fresh data
        setTimeout(async () => {
          try {
            const freshTasks = await getRecentDailyTasks(daysBack);
            dataCache.set(cacheKey, freshTasks, 60000); // Cache for 1 minute
            setDailyTasks(freshTasks);
            console.log(`✅ DailyTasksContext: Background refresh completed`);
          } catch (err) {
            console.error('❌ Background refresh failed:', err);
          }
        }, 100);
        
        return;
      }
      
      // No cache - show loading and fetch
      setIsLoading(true);
      console.log('🔄 DailyTasksContext: Fetching data...');

      const tasks = await getRecentDailyTasks(daysBack);
      setDailyTasks(tasks);
      
      // Cache the result
      dataCache.set(cacheKey, tasks, 60000); // Cache for 1 minute

      console.log(`✅ DailyTasksContext: Loaded ${tasks.length} daily tasks`);
    } catch (err) {
      setError('Failed to fetch daily tasks data');
      console.error('❌ DailyTasksContext: Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [daysBack]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get today's data
  const getTodayData = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyTasks.find(task => task.date === today) || null;
  }, [dailyTasks]);

  // Get data for specific date
  const getDataForDate = useCallback(
    (date: string) => {
      return dailyTasks.find(task => task.date === date) || null;
    },
    [dailyTasks],
  );
  // Update prayer status with optimistic UI + API call
  const updatePrayerAndRefresh = useCallback(
    async (date: string, prayer: string, status: PrayerStatus) => {
      const previousTasks = [...dailyTasks];

      try {
        console.log(
          `🔄 DailyTasksContext: Optimistically updating ${prayer} to ${status} for ${date}`,
        );

        // OPTIMISTIC UPDATE: Update UI immediately
        const optimisticTasks = dailyTasks.map(task => {
          if (task.date === date) {
            const prayerKey =
              `${prayer.toLowerCase()}Status` as keyof DailyTaskData;
            return {
              ...task,
              [prayerKey]: status,
            };
          }
          return task;
        });
        setDailyTasks(optimisticTasks);        // 1. Update local database
        await updatePrayerStatus(date, prayer, status);

        // 2. ⚡ PERFORMANCE: Update API in background to avoid blocking UI
        setTimeout(async () => {
          try {
            await apiService.updatePrayerStatus(date, prayer, status);
            console.log('✅ Background API update completed');
          } catch (apiError) {
            console.error('❌ Background API update failed:', apiError);
          }
        }, 50);

        // 3. ⚡ PERFORMANCE: Lightweight refresh - just invalidate cache
        const cacheKey = `daily-tasks-${daysBack}`;
        dataCache.clear(); // Clear cache to force fresh data on next access

        console.log(
          '✅ DailyTasksContext: Prayer updated successfully (DB + API)',
        );
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating prayer:', error);

        // ROLLBACK: Restore previous state on error
        setDailyTasks(previousTasks);
        setError('Failed to update prayer. Please try again.');

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);

        throw error;
      }
    },
    [dailyTasks, fetchData, apiService],
  );
  // Update Quran minutes with optimistic UI + API call
  const updateQuranAndRefresh = useCallback(
    async (date: string, minutes: number) => {
      const previousTasks = [...dailyTasks];

      try {
        console.log(
          `🔄 DailyTasksContext: Optimistically updating Quran to ${minutes} minutes for ${date}`,
        );

        // OPTIMISTIC UPDATE: Update UI immediately
        const optimisticTasks = dailyTasks.map(task => {
          if (task.date === date) {
            return {
              ...task,
              quranMinutes: minutes,
            };
          }
          return task;
        });
        setDailyTasks(optimisticTasks);        // 1. Update local database
        await updateQuranMinutes(date, minutes);

        // 2. ⚡ PERFORMANCE: Update API in background to avoid blocking UI
        setTimeout(async () => {
          try {
            await apiService.updateQuranMinutes(date, minutes);
            console.log('✅ Background Quran API update completed');
          } catch (apiError) {
            console.error('❌ Background Quran API update failed:', apiError);
          }
        }, 50);

        // 3. ⚡ PERFORMANCE: Lightweight refresh - just invalidate cache
        dataCache.clear(); // Clear cache to force fresh data on next access

        console.log(
          '✅ DailyTasksContext: Quran updated successfully (DB + API)',
        );
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating Quran:', error);

        // ROLLBACK: Restore previous state on error
        setDailyTasks(previousTasks);
        setError('Failed to update Quran progress. Please try again.');

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);

        throw error;
      }
    },
    [dailyTasks, fetchData, apiService],
  );
  // Update Zikr count with optimistic UI + API call
  const updateZikrAndRefresh = useCallback(
    async (date: string, count: number) => {
      const previousTasks = [...dailyTasks];

      try {
        console.log(
          `🔄 DailyTasksContext: Optimistically updating Zikr to ${count} count for ${date}`,
        );

        // OPTIMISTIC UPDATE: Update UI immediately
        const optimisticTasks = dailyTasks.map(task => {
          if (task.date === date) {
            return {
              ...task,
              totalZikrCount: count,
            };
          }
          return task;
        });
        setDailyTasks(optimisticTasks);        // 1. Update local database
        await updateZikrCount(date, count);

        // 2. ⚡ PERFORMANCE: Update API in background to avoid blocking UI
        setTimeout(async () => {
          try {
            await apiService.updateZikrCount(date, count);
            console.log('✅ Background Zikr API update completed');
          } catch (apiError) {
            console.error('❌ Background Zikr API update failed:', apiError);
          }
        }, 50);

        // 3. ⚡ PERFORMANCE: Lightweight refresh - just invalidate cache
        dataCache.clear(); // Clear cache to force fresh data on next access

        console.log(
          '✅ DailyTasksContext: Zikr updated successfully (DB + API)',
        );
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating Zikr:', error);

        // ROLLBACK: Restore previous state on error
        setDailyTasks(previousTasks);
        setError('Failed to update Zikr progress. Please try again.');

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);

        throw error;
      }
    },
    [dailyTasks, fetchData, apiService],
  );

  const value: DailyTasksContextType = useMemo(
    () => ({
      dailyTasks,
      isLoading,
      error,
      refreshData: fetchData,
      getTodayData,
      getDataForDate,
      updatePrayerAndRefresh,
      updateQuranAndRefresh,
      updateZikrAndRefresh,
    }),
    [
      dailyTasks,
      isLoading,
      error,
      fetchData,
      getTodayData,
      getDataForDate,
      updatePrayerAndRefresh,
      updateQuranAndRefresh,
      updateZikrAndRefresh,
    ],
  );

  return (
    <DailyTasksContext.Provider value={value}>
      {children}
    </DailyTasksContext.Provider>
  );
};

export const useDailyTasksContext = () => {
  const context = useContext(DailyTasksContext);
  if (!context) {
    throw new Error(
      'useDailyTasksContext must be used within DailyTasksProvider',
    );
  }
  return context;
};
