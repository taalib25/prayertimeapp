import React, {createContext, useContext, useCallback, useMemo} from 'react';
import {PrayerStatus} from '../model/DailyTasks';
import {useDailyTasks} from '../hooks/useDailyTasks';
import {getTodayDateString} from '../utils/helpers';

interface DailyTasksContextType {
  // Data from WatermelonDB reactive hook
  dailyTasks: any[];
  isLoading: boolean;
  error: string | null;

  // Methods
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  getTodayData: () => any | null;
  getDataForDate: (date: string) => any | null;

  // Update methods that use WatermelonDB reactive updates
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
  // Use the reactive WatermelonDB hook
  const {
    dailyTasks,
    isLoading,
    updatePrayerStatus,
    updateQuranMinutes,
    updateZikrCount,
    getTaskForDate,
    refresh,
    triggerUpdate,
  } = useDailyTasks(daysBack);

  // Get today's data
  const getTodayData = useCallback(() => {
    const today = getTodayDateString();
    return getTaskForDate(today);
  }, [getTaskForDate]);

  // Get data for specific date
  const getDataForDate = useCallback(
    (date: string) => {
      return getTaskForDate(date);
    },
    [getTaskForDate],
  );

  // Update methods that use WatermelonDB reactive updates
  const updatePrayerAndRefresh = useCallback(
    async (date: string, prayer: string, status: PrayerStatus) => {
      try {
        console.log(`🔄 Context: Updating ${prayer} to ${status} for ${date}`);
        await updatePrayerStatus(date, prayer, status);
        console.log(
          '✅ Context: Prayer update completed with reactive updates',
        );
      } catch (error) {
        console.error('❌ Context: Error updating prayer:', error);
        throw error;
      }
    },
    [updatePrayerStatus],
  );

  const updateQuranAndRefresh = useCallback(
    async (date: string, minutes: number) => {
      try {
        console.log(
          `🔄 Context: Updating Quran to ${minutes} minutes for ${date}`,
        );
        await updateQuranMinutes(date, minutes);
        console.log('✅ Context: Quran update completed with reactive updates');
      } catch (error) {
        console.error('❌ Context: Error updating Quran:', error);
        throw error;
      }
    },
    [updateQuranMinutes],
  );

  const updateZikrAndRefresh = useCallback(
    async (date: string, count: number) => {
      try {
        console.log(`🔄 Context: Updating Zikr to ${count} count for ${date}`);
        await updateZikrCount(date, count);
        console.log('✅ Context: Zikr update completed with reactive updates');
      } catch (error) {
        console.error('❌ Context: Error updating Zikr:', error);
        throw error;
      }
    },
    [updateZikrCount],
  );

  // Force refresh method
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Context: Forcing data refresh with reactive updates...');
    triggerUpdate();
    await refresh();
  }, [refresh, triggerUpdate]);

  const value: DailyTasksContextType = useMemo(
    () => ({
      dailyTasks,
      isLoading,
      error: null, // WatermelonDB hook handles errors internally
      refreshData: refresh,
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
      refresh,
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
