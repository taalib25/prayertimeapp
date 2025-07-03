import React, {createContext, useContext, useMemo} from 'react';
import {useMonthlyAggregatedData} from '../hooks/useContextualData';
import {dataCache} from '../utils/dataCache';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
}

interface MonthData {
  monthLabel: string;
  year: number;
  zikr: {current: number; total: number};
  quran: {current: number; total: number};
  fajr: {current: number; total: number};
  isha: {current: number; total: number};
}

interface MonthlyTaskContextType {
  monthlyData: MonthData[];
  getCurrentMonthIndex: () => number;
}

const MonthlyTaskContext = createContext<MonthlyTaskContextType | undefined>(
  undefined,
);

const MOCK_USER_ID = 1001;

export const MonthlyTaskProvider: React.FC<{
  children: React.ReactNode;
  userGoals?: UserGoals;
}> = ({children, userGoals}) => {
  // Default goals
  const defaultGoals = {
    monthlyZikrGoal: 3000,
    monthlyQuranPagesGoal: 300,
  };
  const goals = userGoals || defaultGoals;

  // Get monthly data using the centralized context instead of direct database access
  const {getMonthlyStats} = useMonthlyAggregatedData(); // Get daily tasks data to include in dependency
  const {dailyTasks} = useMonthlyAggregatedData(); // Transform raw data to format needed for UI
  const monthlyData = useMemo(() => {
    // ⚡ PERFORMANCE: Cache monthly data calculations - include detailed dailyTasks hash for reactivity
    const quranTotal = dailyTasks.reduce(
      (sum, t) => sum + (t.quranMinutes || 0),
      0,
    );
    const zikrTotal = dailyTasks.reduce(
      (sum, t) => sum + (t.totalZikrCount || 0),
      0,
    );
    const dailyTasksHash = `${dailyTasks.length}-Q${quranTotal}-Z${zikrTotal}`;
    const cacheKey = `monthly-stats-${JSON.stringify(goals)}-${dailyTasksHash}`;

    console.log(
      `🔍 MonthlyTaskContext: Detailed stats - Length: ${dailyTasks.length}, Quran: ${quranTotal}, Zikr: ${zikrTotal}`,
    );
    console.log(
      `🔍 MonthlyTaskContext: Cache key: ${cacheKey.slice(0, 120)}...`,
    );

    let cached = dataCache.get<MonthData[]>(cacheKey);
    if (cached) {
      console.log('📊 Using cached monthly data with hash:', dailyTasksHash);
      return cached;
    }

    console.log('🔄 Computing fresh monthly data transform...');

    // Generate all months for the past 3 months
    const today = new Date();
    const allMonths = [];

    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', {month: 'long'});
      const year = monthDate.getFullYear();

      // Get existing data for this month using centralized context
      const existingData = getMonthlyStats(year, monthDate.getMonth());

      // Create month data with existing or default values
      allMonths.push({
        monthLabel: monthName,
        year: year,
        zikr: {
          current: existingData?.totalZikr || 0,
          total: goals.monthlyZikrGoal,
        },
        quran: {
          current: existingData?.totalQuranPages || 0,
          total: goals.monthlyQuranPagesGoal,
        },
        fajr: {
          current: existingData?.fajrCompletedDays || 0,
          total:
            existingData?.totalDays ||
            new Date(year, monthDate.getMonth() + 1, 0).getDate(),
        },
        isha: {
          current: existingData?.ishaCompletedDays || 0,
          total:
            existingData?.totalDays ||
            new Date(year, monthDate.getMonth() + 1, 0).getDate(),
        },
      });
    } // Cache the result for 30 seconds (reduced from 2 minutes for better reactivity)
    dataCache.set(cacheKey, allMonths, 30000);
    console.log('💾 Monthly data cached with key:', dailyTasksHash);
    return allMonths;
  }, [getMonthlyStats, goals, dailyTasks]); // Include dailyTasks for reactivity

  // Get current month index
  const getCurrentMonthIndex = useMemo(() => {
    return () => {
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
    };
  }, [monthlyData]);

  const value: MonthlyTaskContextType = {
    monthlyData,
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
