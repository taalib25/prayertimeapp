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
import {getTodayDateString} from '../utils/helpers';

interface DailyTasksContextType {
  // Data
  dailyTasks: DailyTaskData[];
  isLoading: boolean;
  error: string | null;

  // Methods
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>;
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
            console.log('✅ DailyTasksContext: Background refresh completed');
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
    const today = getTodayDateString();
    return dailyTasks.find(task => task.date === today) || null;
  }, [dailyTasks]);

  // Get data for specific date
  const getDataForDate = useCallback(
    (date: string) => {
      return dailyTasks.find(task => task.date === date) || null;
    },
    [dailyTasks],
  ); // Simple approach: Update state -> Update database -> Update API -> Refresh UI
  const updatePrayerAndRefresh = useCallback(
    async (date: string, prayer: string, status: PrayerStatus) => {
      try {
        console.log(`🔄 Updating ${prayer} to ${status} for ${date}`); // 1. Update state immediately for instant UI response
        setDailyTasks(prevTasks => {
          // Check if task for this date exists
          const taskExists = prevTasks.some(task => task.date === date);

          if (taskExists) {
            // Update existing task
            return prevTasks.map(task => {
              if (task.date === date) {
                const prayerKey =
                  `${prayer.toLowerCase()}Status` as keyof DailyTaskData;
                return {...task, [prayerKey]: status};
              }
              return task;
            });
          } else {
            // Create new task for this date with current prayer status
            const newTask: DailyTaskData = {
              date,
              fajrStatus: prayer.toLowerCase() === 'fajr' ? status : 'none',
              dhuhrStatus: prayer.toLowerCase() === 'dhuhr' ? status : 'none',
              asrStatus: prayer.toLowerCase() === 'asr' ? status : 'none',
              maghribStatus:
                prayer.toLowerCase() === 'maghrib' ? status : 'none',
              ishaStatus: prayer.toLowerCase() === 'isha' ? status : 'none',
              totalZikrCount: 0,
              quranMinutes: 0,
              specialTasks: [],
            };

            // Add new task and sort by date (newest first)
            const updatedTasks = [...prevTasks, newTask];
            return updatedTasks.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          }
        });

        // 2. Update local database
        await updatePrayerStatus(date, prayer, status);

        // 3. Update API
        try {
          await apiService.updatePrayerStatus(date, prayer, status);
          console.log('✅ API update completed');
        } catch (apiError) {
          console.warn('⚠️ API update failed, but local DB updated:', apiError);
        }

        // 4. Clear cache for next fetch
        dataCache.clear();

        console.log('✅ Prayer updated and UI refreshed');
      } catch (error) {
        console.error('❌ Error updating prayer:', error);
        setError('Failed to update prayer. Please try again.');
        setTimeout(() => setError(null), 3000);
        throw error;
      }
    },
    [apiService],
  ); // Simple approach: Update state -> Update database -> Update API -> Refresh UI
  const updateQuranAndRefresh = useCallback(
    async (date: string, minutes: number) => {
      try {
        console.log(`🔄 Updating Quran to ${minutes} minutes for ${date}`); // 1. Update state immediately for instant UI response
        setDailyTasks(prevTasks => {
          const taskExists = prevTasks.some(task => task.date === date);

          if (taskExists) {
            return prevTasks.map(task => {
              if (task.date === date) {
                return {...task, quranMinutes: minutes};
              }
              return task;
            });
          } else {
            // Create new task for this date with Quran minutes
            const newTask: DailyTaskData = {
              date,
              fajrStatus: 'none',
              dhuhrStatus: 'none',
              asrStatus: 'none',
              maghribStatus: 'none',
              ishaStatus: 'none',
              totalZikrCount: 0,
              quranMinutes: minutes,
              specialTasks: [],
            };

            const updatedTasks = [...prevTasks, newTask];
            return updatedTasks.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          }
        });

        // 2. Update local database
        await updateQuranMinutes(date, minutes);

        // 3. Update API
        try {
          await apiService.updateQuranMinutes(date, minutes);
          console.log('✅ API update completed');
        } catch (apiError) {
          console.warn('⚠️ API update failed, but local DB updated:', apiError);
        } // 4. Clear cache for next fetch and force monthly data refresh
        dataCache.clear(); // Clear all caches including monthly stats
        console.log('🧹 All caches cleared after Quran update');

        console.log('✅ Quran updated and UI refreshed');
      } catch (error) {
        console.error('❌ Error updating Quran:', error);
        setError('Failed to update Quran progress. Please try again.');
        setTimeout(() => setError(null), 3000);
        throw error;
      }
    },
    [apiService],
  ); // Simple approach: Update state -> Update database -> Update API -> Refresh UI
  const updateZikrAndRefresh = useCallback(
    async (date: string, count: number) => {
      try {
        console.log(`🔄 Updating Zikr to ${count} count for ${date}`); // 1. Update state immediately for instant UI response
        setDailyTasks(prevTasks => {
          const taskExists = prevTasks.some(task => task.date === date);

          if (taskExists) {
            return prevTasks.map(task => {
              if (task.date === date) {
                return {...task, totalZikrCount: count};
              }
              return task;
            });
          } else {
            // Create new task for this date with Zikr count
            const newTask: DailyTaskData = {
              date,
              fajrStatus: 'none',
              dhuhrStatus: 'none',
              asrStatus: 'none',
              maghribStatus: 'none',
              ishaStatus: 'none',
              totalZikrCount: count,
              quranMinutes: 0,
              specialTasks: [],
            };

            const updatedTasks = [...prevTasks, newTask];
            return updatedTasks.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          }
        });

        // 2. Update local database
        await updateZikrCount(date, count);

        // 3. Update API
        try {
          await apiService.updateZikrCount(date, count);
          console.log('✅ API update completed');
        } catch (apiError) {
          console.warn('⚠️ API update failed, but local DB updated:', apiError);
        } // 4. Clear cache for next fetch and force monthly data refresh
        dataCache.clear(); // Clear all caches including monthly stats
        console.log('🧹 All caches cleared after Zikr update');

        console.log('✅ Zikr updated and UI refreshed');
      } catch (error) {
        console.error('❌ Error updating Zikr:', error);
        setError('Failed to update Zikr progress. Please try again.');
        setTimeout(() => setError(null), 3000);
        throw error;
      }
    },
    [apiService],
  );

  // Forced refresh method to ensure UI updates
  const forceRefresh = useCallback(async () => {
    console.log('🔄 DailyTasksContext: Forcing data refresh...');
    setIsLoading(true);

    // Clear all caches
    dataCache.clear();

    // Refetch data
    await fetchData();
  }, [fetchData]);
  const value: DailyTasksContextType = useMemo(
    () => ({
      dailyTasks,
      isLoading,
      error,
      refreshData: fetchData,
      forceRefresh,
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
      forceRefresh,
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
