import {useMemo} from 'react';
import {useDailyTasksContext} from '../contexts/DailyTasksContext';
import {DailyTaskData} from '../services/db/dailyTaskServices';
import {PrayerStatus} from '../model/DailyTasks';

/**
 * Hook to get prayer times data using the centralized context
 * Replaces direct database calls in PrayerTimeCards
 */
export const usePrayerData = () => {
  const {dailyTasks, getTodayData, updatePrayerAndRefresh} =
    useDailyTasksContext();

  const todayData = useMemo(() => getTodayData(), [getTodayData]);

  const getPrayerStatus = useMemo(() => {
    return (prayerName: string): PrayerStatus => {
      if (!todayData) return 'none';

      const lcPrayerName = prayerName.toLowerCase();
      switch (lcPrayerName) {
        case 'fajr':
          return todayData.fajrStatus;
        case 'dhuhr':
          return todayData.dhuhrStatus;
        case 'asr':
          return todayData.asrStatus;
        case 'maghrib':
          return todayData.maghribStatus;
        case 'isha':
          return todayData.ishaStatus;
        default:
          return 'none';
      }
    };
  }, [todayData]);

  const updatePrayerStatus = useMemo(() => {
    return async (prayerName: string, status: PrayerStatus) => {
      const today = new Date().toISOString().split('T')[0];
      await updatePrayerAndRefresh(today, prayerName, status);
    };
  }, [updatePrayerAndRefresh]);

  return {
    todayData,
    getPrayerStatus,
    updatePrayerStatus,
    isLoading: !todayData,
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
        (sum, task) => sum + Math.floor((task.quranMinutes || 0) / 10),
        0,
      ); // Assuming 10 min = 1 page
      const fajrCompletedDays = monthTasks.filter(
        task => task.fajrStatus === 'mosque',
      ).length;
      const ishaCompletedDays = monthTasks.filter(
        task => task.ishaStatus === 'mosque',
      ).length;
      const totalDays = monthTasks.length;

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

// Helper function
const formatDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en', options);
};
