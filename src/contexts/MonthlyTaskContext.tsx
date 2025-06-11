import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {useRecentDailyTasks, useMonthlyData} from '../hooks/useDailyTasks';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

interface MonthData {
  monthLabel: string;
  year: number;
  zikr: {current: number; total: number};
  quran: {current: number; total: number};
  fajr: {current: number; total: number};
  isha: {current: number; total: number};
}

interface OptimisticUpdates {
  zikr?: number;
  quran?: number;
}

interface MonthlyTaskContextType {
  monthlyData: MonthData[];
  todayData: {zikr: number; quranPages: number};
  isLoading: boolean;
  updateZikr: (value: number) => Promise<void>;
  updateQuran: (value: number) => Promise<void>;
  getCurrentMonthIndex: () => number;
}

const MonthlyTaskContext = createContext<MonthlyTaskContextType | undefined>(
  undefined,
);

const MOCK_USER_ID = 1001;

const getMonthNumber = (monthName: string): number => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months.indexOf(monthName);
};

const getMonthlyData = (
  userGoals?: UserGoals,
  monthlyData?: any[],
): MonthData[] => {
  const defaultGoals = {
    monthlyZikrGoal: 3000,
    monthlyQuranPagesGoal: 300,
    monthlyCharityGoal: 5,
    monthlyFastingDaysGoal: 6,
  };

  const goals = userGoals || defaultGoals;

  return (
    monthlyData?.map(monthData => ({
      monthLabel: monthData.monthName,
      year: monthData.year,
      zikr: {
        current: monthData.totalZikr,
        total: goals.monthlyZikrGoal,
      },
      quran: {
        current: monthData.totalQuranPages,
        total: goals.monthlyQuranPagesGoal,
      },
      fajr: {
        current: monthData.fajrCompletedDays,
        total: monthData.totalDays,
      },
      isha: {
        current: monthData.ishaCompletedDays,
        total: monthData.totalDays,
      },
    })) || []
  );
};

export const MonthlyTaskProvider: React.FC<{
  children: React.ReactNode;
  userGoals?: UserGoals;
}> = ({children, userGoals}) => {
  // Optimistic update state
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdates>(
    {},
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Data hooks
  const {monthlyData: rawMonthlyData, refetch: refetchMonthly} = useMonthlyData(
    {
      uid: MOCK_USER_ID,
      monthsBack: 3,
    },
  );

  const {
    recentTasks,
    updateZikrForDate,
    updateQuranForDate,
    refetch: refetchDaily,
  } = useRecentDailyTasks({
    uid: MOCK_USER_ID,
    daysBack: 1,
  });

  // Process and sort monthly data
  const processedMonthlyData = useMemo(() => {
    const data = getMonthlyData(userGoals, rawMonthlyData);
    return data.sort((a, b) => {
      const dateA = new Date(a.year, getMonthNumber(a.monthLabel));
      const dateB = new Date(b.year, getMonthNumber(b.monthLabel));
      return dateA.getTime() - dateB.getTime();
    });
  }, [userGoals, rawMonthlyData]);

  // Today's data with optimistic updates
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTask = recentTasks.find(task => task.date === today);
    return {
      zikr: optimisticUpdates.zikr ?? (todayTask?.totalZikrCount || 0),
      quranPages: optimisticUpdates.quran ?? (todayTask?.quranPagesRead || 0),
    };
  }, [recentTasks, optimisticUpdates]);

  // Enhanced monthly data with optimistic updates
  const monthlyData = useMemo(() => {
    if (!processedMonthlyData.length) return processedMonthlyData;

    const updated = [...processedMonthlyData];
    const currentMonthIndex = updated.length - 1;

    if (currentMonthIndex >= 0 && Object.keys(optimisticUpdates).length > 0) {
      const currentMonth = updated[currentMonthIndex];

      // Get original today's values
      const todayTaskData = recentTasks.find(
        task => task.date === new Date().toISOString().split('T')[0],
      );
      const originalTodayZikr = todayTaskData?.totalZikrCount || 0;
      const originalTodayQuran = todayTaskData?.quranPagesRead || 0;

      // Calculate differences
      const zikrDifference =
        (optimisticUpdates.zikr ?? originalTodayZikr) - originalTodayZikr;
      const quranDifference =
        (optimisticUpdates.quran ?? originalTodayQuran) - originalTodayQuran;

      updated[currentMonthIndex] = {
        ...currentMonth,
        zikr: {
          ...currentMonth.zikr,
          current: Math.max(0, currentMonth.zikr.current + zikrDifference),
        },
        quran: {
          ...currentMonth.quran,
          current: Math.max(0, currentMonth.quran.current + quranDifference),
        },
      };
    }

    return updated;
  }, [processedMonthlyData, recentTasks, optimisticUpdates]);

  // Get current month index
  const getCurrentMonthIndex = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthName = currentDate.toLocaleDateString('en-US', {
      month: 'long',
    });

    const currentMonthIndex = monthlyData.findIndex(
      month =>
        month.year === currentYear && month.monthLabel === currentMonthName,
    );

    return currentMonthIndex >= 0
      ? currentMonthIndex
      : Math.max(0, monthlyData.length - 1);
  }, [monthlyData]);

  // Update functions with optimistic updates
  const updateZikr = useCallback(
    async (value: number) => {
      const today = new Date().toISOString().split('T')[0];

      try {
        setIsUpdating(true);

        // Optimistic update
        setOptimisticUpdates(prev => ({...prev, zikr: value}));

        // Database update
        await updateZikrForDate(today, value);

        // Background refresh and cleanup
        Promise.all([refetchMonthly(), refetchDaily()]).finally(() => {
          setOptimisticUpdates(prev => {
            const {zikr, ...rest} = prev;
            return rest;
          });
          setIsUpdating(false);
        });
      } catch (error) {
        console.error('Failed to update zikr:', error);
        // Revert optimistic update on error
        setOptimisticUpdates(prev => {
          const {zikr, ...rest} = prev;
          return rest;
        });
        setIsUpdating(false);
        throw error;
      }
    },
    [updateZikrForDate, refetchMonthly, refetchDaily],
  );

  const updateQuran = useCallback(
    async (value: number) => {
      const today = new Date().toISOString().split('T')[0];

      try {
        setIsUpdating(true);

        // Optimistic update
        setOptimisticUpdates(prev => ({...prev, quran: value}));

        // Database update
        await updateQuranForDate(today, value);

        // Background refresh and cleanup
        Promise.all([refetchMonthly(), refetchDaily()]).finally(() => {
          setOptimisticUpdates(prev => {
            const {quran, ...rest} = prev;
            return rest;
          });
          setIsUpdating(false);
        });
      } catch (error) {
        console.error('Failed to update quran:', error);
        // Revert optimistic update on error
        setOptimisticUpdates(prev => {
          const {quran, ...rest} = prev;
          return rest;
        });
        setIsUpdating(false);
        throw error;
      }
    },
    [updateQuranForDate, refetchMonthly, refetchDaily],
  );

  const value: MonthlyTaskContextType = {
    monthlyData,
    todayData,
    isLoading: isUpdating,
    updateZikr,
    updateQuran,
    getCurrentMonthIndex,
  };

  return (
    <MonthlyTaskContext.Provider value={value}>
      {children}
    </MonthlyTaskContext.Provider>
  );
};

export const useMonthlyTask = () => {
  const context = useContext(MonthlyTaskContext);
  if (!context) {
    throw new Error('useMonthlyTask must be used within MonthlyTaskProvider');
  }
  return context;
};
