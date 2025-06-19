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

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 DailyTasksContext: Fetching data...');

      const tasks = await getRecentDailyTasks(daysBack);
      setDailyTasks(tasks);

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

  // Update prayer status and refresh all UI
  const updatePrayerAndRefresh = useCallback(
    async (date: string, prayer: string, status: PrayerStatus) => {
      try {
        console.log(
          `🔄 DailyTasksContext: Updating ${prayer} to ${status} for ${date}`,
        );

        await updatePrayerStatus(date, prayer, status);

        // Refresh data to update all UIs
        await fetchData();

        console.log('✅ DailyTasksContext: Prayer updated and UI refreshed');
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating prayer:', error);
        throw error;
      }
    },
    [fetchData],
  );

  // Update Quran minutes and refresh all UI
  const updateQuranAndRefresh = useCallback(
    async (date: string, minutes: number) => {
      try {
        console.log(
          `🔄 DailyTasksContext: Updating Quran to ${minutes} minutes for ${date}`,
        );

        await updateQuranMinutes(date, minutes);

        // Refresh data to update all UIs
        await fetchData();

        console.log('✅ DailyTasksContext: Quran updated and UI refreshed');
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating Quran:', error);
        throw error;
      }
    },
    [fetchData],
  );

  // Update Zikr count and refresh all UI
  const updateZikrAndRefresh = useCallback(
    async (date: string, count: number) => {
      try {
        console.log(
          `🔄 DailyTasksContext: Updating Zikr to ${count} count for ${date}`,
        );

        await updateZikrCount(date, count);

        // Refresh data to update all UIs
        await fetchData();

        console.log('✅ DailyTasksContext: Zikr updated and UI refreshed');
      } catch (error) {
        console.error('❌ DailyTasksContext: Error updating Zikr:', error);
        throw error;
      }
    },
    [fetchData],
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
