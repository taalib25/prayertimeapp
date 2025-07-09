import {useMemo, useEffect, useState, useCallback} from 'react';
import {useDailyTasksContext} from '../contexts/DailyTasksContext';
import {DailyTaskData} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';
import {getTodayDateString} from '../utils/helpers';

/**
 * Helper to check if a prayer is in the future
 * @param prayerName Name of the prayer
 * @param prayerTimeStr Prayer time string in HH:MM format
 * @returns boolean indicating if prayer is in the future
 */
const isPrayerInFuture = (prayerName: string): boolean => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // Approximate prayer times for comparison
  // In a real app, these would come from the prayer times data
  const prayerHours = {
    fajr: 5, // 5 AM
    dhuhr: 12, // 12 PM
    asr: 15, // 3 PM
    maghrib: 18, // 6 PM
    isha: 20, // 8 PM
  };

  const prayerName_lower = prayerName.toLowerCase();
  if (!(prayerName_lower in prayerHours)) {
    return false;
  }

  const hours = prayerHours[prayerName_lower as keyof typeof prayerHours];

  // Compare times
  if (hours > currentHours) {
    return true;
  } else if (hours === currentHours && 0 > currentMinutes) {
    return true;
  }

  return false;
};

/**
 * Hook to get prayer times data using the centralized context
 * Enhanced to support any date, not just today
 */
export const usePrayerData = (targetDate?: string) => {
  const {dailyTasks, getTodayData, getDataForDate, updatePrayerAndRefresh} =
    useDailyTasksContext();

  // Get data for the specified date or today's data if no date specified
  // Adding dailyTasks to dependency ensures re-render when data changes
  const targetData = useMemo(() => {
    if (targetDate) {
      return getDataForDate(targetDate);
    }
    return getTodayData();
  }, [targetDate, getDataForDate, getTodayData, dailyTasks]);

  const isToday = useMemo(() => {
    const today = getTodayDateString();
    return !targetDate || targetDate === today;
  }, [targetDate]);

  const getPrayerStatus = useMemo(() => {
    return (prayerName: string): PrayerStatus => {
      if (!targetData) {
        return null;
      }

      const lcPrayerName = prayerName.toLowerCase();
      switch (lcPrayerName) {
        case 'fajr':
          return targetData.fajrStatus || null;
        case 'dhuhr':
          return targetData.dhuhrStatus || null;
        case 'asr':
          return targetData.asrStatus || null;
        case 'maghrib':
          return targetData.maghribStatus || null;
        case 'isha':
          return targetData.ishaStatus || null;
        default:
          return null;
      }
    };
  }, [targetData]);

  // Check if a prayer can be marked based on date and time
  const canMarkPrayer = useCallback(
    (prayerName: string): boolean => {
      // Can only mark prayers for today
      if (!isToday) return false;

      // Can't mark future prayers
      if (isPrayerInFuture(prayerName)) return false;

      return true;
    },
    [isToday],
  );

  const updatePrayerStatus = useMemo(() => {
    return async (prayerName: string, status: PrayerStatus) => {
      // If can't mark this prayer, don't update
      if (!canMarkPrayer(prayerName)) {
        console.log(
          `Cannot mark ${prayerName} prayer - either not today or future prayer`,
        );
        return;
      }

      // Use the target date (or today if no target date specified)
      const dateToUpdate = targetDate || getTodayDateString();
      await updatePrayerAndRefresh(dateToUpdate, prayerName, status);
    };
  }, [updatePrayerAndRefresh, targetDate, canMarkPrayer]);

  return {
    todayData: targetData, // Return the target data (could be today or another date)
    getPrayerStatus,
    updatePrayerStatus,
    canMarkPrayer,
    isLoading: !targetData,
    isToday,
  };
};

/**
 * Hook to get Fajr chart data using the centralized context
 * Replaces direct database calls in FajrTimeChart
 */
export const useFajrChartData = () => {
  const {dailyTasks, getDataForDate} = useDailyTasksContext();

  const getFajrDataForDates = useMemo(() => {
    return (dates: string[]) => {
      return dates.map(date => {
        const dayData = getDataForDate(date);
        return {
          date,
          fajrStatus: dayData?.fajrStatus || 'none',
          completionValue: dayData?.fajrStatus === 'mosque' ? 1 : 0,
          dayLabel: formatDayLabel(date),
        };
      });
    };
  }, [getDataForDate, dailyTasks]);

  return {
    getFajrDataForDates,
    dailyTasks,
  };
};

/**
 * Hook to get monthly aggregated data using the centralized context
 * Can be used to replace some monthly calculations
 */
export const useMonthlyAggregatedData = () => {
  const {dailyTasks} = useDailyTasksContext();
  const getMonthlyStats = useMemo(() => {
    return (year: number, monthIndex: number) => {
      console.log(
        `📊 useMonthlyAggregatedData: Computing stats for ${year}-${
          monthIndex + 1
        } with ${dailyTasks.length} daily tasks`,
      );

      const monthTasks = dailyTasks.filter(task => {
        const taskDate = new Date(task.date);
        return (
          taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex
        );
      });

      const totalZikr = monthTasks.reduce(
        (sum, task) => sum + (task.totalZikrCount || 0),
        0,
      );
      const totalQuranPages = monthTasks.reduce(
        (sum, task) => sum + Math.floor((task.quranMinutes || 0) / 15),
        0,
      ); // Using 15-minute sessions
      const fajrCompletedDays = monthTasks.filter(
        task => task.fajrStatus === 'mosque',
      ).length;
      const ishaCompletedDays = monthTasks.filter(
        task => task.ishaStatus === 'mosque',
      ).length;
      const totalDays = monthTasks.length;

      console.log(
        `📊 Month stats computed: Quran=${totalQuranPages}, Zikr=${totalZikr}, Fajr=${fajrCompletedDays}, Isha=${ishaCompletedDays}`,
      );

      return {
        totalZikr,
        totalQuranPages,
        fajrCompletedDays,
        ishaCompletedDays,
        totalDays,
      };
    };
  }, [dailyTasks]);

  return {
    getMonthlyStats,
    dailyTasks,
  };
};

/**
 * Hook to get Quran data using the centralized context
 * Enhanced to support any date, not just today
 */
export const useQuranData = (targetDate?: string) => {
  const {dailyTasks, getTodayData, getDataForDate, updateQuranAndRefresh} =
    useDailyTasksContext();

  // Get data for the specified date or today's data if no date specified
  // Adding dailyTasks to dependency ensures re-render when data changes
  const targetData = useMemo(() => {
    if (targetDate) {
      return getDataForDate(targetDate);
    }
    return getTodayData();
  }, [targetDate, getDataForDate, getTodayData, dailyTasks]);

  const getQuranMinutes = useMemo(() => {
    return (): number => {
      return targetData?.quranMinutes || 0;
    };
  }, [targetData]);

  const updateQuranMinutes = useMemo(() => {
    return async (minutes: number) => {
      // Use the target date (or today if no target date specified)
      const dateToUpdate = targetDate || getTodayDateString();
      await updateQuranAndRefresh(dateToUpdate, minutes);
    };
  }, [updateQuranAndRefresh, targetDate]);

  return {
    todayData: targetData, // Return the target data (could be today or another date)
    getQuranMinutes,
    updateQuranMinutes,
    isLoading: !targetData,
  };
};

/**
 * Hook to get Zikr data using the centralized context
 * Enhanced to support any date, not just today
 */
export const useZikrData = (targetDate?: string) => {
  const {dailyTasks, getTodayData, getDataForDate, updateZikrAndRefresh} =
    useDailyTasksContext();

  // Get data for the specified date or today's data if no date specified
  // Adding dailyTasks to dependency ensures re-render when data changes
  const targetData = useMemo(() => {
    if (targetDate) {
      return getDataForDate(targetDate);
    }
    return getTodayData();
  }, [targetDate, getDataForDate, getTodayData, dailyTasks]);

  const getZikrCount = useMemo(() => {
    return (): number => {
      return targetData?.totalZikrCount || 0;
    };
  }, [targetData]);

  const updateZikrCount = useMemo(() => {
    return async (count: number) => {
      // Use the target date (or today if no target date specified)
      const dateToUpdate = targetDate || getTodayDateString();
      await updateZikrAndRefresh(dateToUpdate, count);
    };
  }, [updateZikrAndRefresh, targetDate]);

  return {
    todayData: targetData, // Return the target data (could be today or another date)
    getZikrCount,
    updateZikrCount,
    isLoading: !targetData,
  };
};

// Helper function
const formatDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  if (diffDays === -1) {
    return 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en', options);
};
