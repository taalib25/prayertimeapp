import React, {createContext, useContext, useMemo} from 'react';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';
import {formatDateString} from '../utils/helpers';

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
  isLoading: boolean;
}

// ✅ PROPER REACTIVE: Context props interface for withObservables
interface MonthlyTaskProviderProps {
  children: React.ReactNode;
  userGoals?: UserGoals;
  dailyTasks: DailyTasksModel[]; // Added for withObservables
}

const MonthlyTaskContext = createContext<MonthlyTaskContextType | undefined>(
  undefined,
);

// ✅ PROPER REACTIVE: Component using withObservables enhanced dailyTasks
const MonthlyTaskProviderInner: React.FC<MonthlyTaskProviderProps> = ({
  children,
  userGoals,
  dailyTasks, // Now comes from withObservables
}) => {
  // Default goals
  const defaultGoals = {
    monthlyZikrGoal: 3000,
    monthlyQuranPagesGoal: 300,
  };
  const goals = userGoals || defaultGoals;

  // ✅ REACTIVE: Direct monthly data calculation using reactive dailyTasks prop
  const monthlyData = useMemo(() => {
    console.log(
      `🔍 MonthlyTaskContext: Computing monthly data from ${dailyTasks.length} reactive daily tasks`,
    );

    // Generate all months for the past 3 months
    const today = new Date();
    const allMonths: MonthData[] = [];

    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', {month: 'long'});
      const year = monthDate.getFullYear();
      const monthIndex = monthDate.getMonth();

      // Filter tasks for this specific month
      const monthTasks = dailyTasks.filter(task => {
        const taskDate = new Date(task.date);
        return (
          taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex
        );
      });

      // Calculate totals directly from filtered tasks
      const totalZikr = monthTasks.reduce(
        (sum, task) => sum + (task.totalZikrCount || 0),
        0,
      );
      const totalQuranMinutes = monthTasks.reduce(
        (sum, task) => sum + (task.quranMinutes || 0),
        0,
      );
      const fajrCompletedDays = monthTasks.filter(
        task => task.fajrStatus === 'mosque' || task.fajrStatus === 'home',
      ).length;
      const ishaCompletedDays = monthTasks.filter(
        task => task.ishaStatus === 'mosque' || task.ishaStatus === 'home',
      ).length;

      // Get total days in this month
      const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      allMonths.push({
        monthLabel: monthName,
        year: year,
        zikr: {
          current: totalZikr,
          total: goals.monthlyZikrGoal,
        },
        quran: {
          current: Math.floor(totalQuranMinutes / 15), // Convert minutes to pages (15 min = 1 page)
          total: goals.monthlyQuranPagesGoal,
        },
        fajr: {
          current: fajrCompletedDays,
          total: totalDaysInMonth,
        },
        isha: {
          current: ishaCompletedDays,
          total: totalDaysInMonth,
        },
      });

      console.log(
        `📊 Month ${monthName}: Zikr=${totalZikr}, Quran=${Math.floor(
          totalQuranMinutes / 15,
        )}, Fajr=${fajrCompletedDays}, Isha=${ishaCompletedDays}`,
      );
    }

    return allMonths;
  }, [dailyTasks, goals]);

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
    isLoading: false,
  };

  return (
    <MonthlyTaskContext.Provider value={value}>
      {children}
    </MonthlyTaskContext.Provider>
  );
};

// ✅ FIXED: Simple reactive configuration - observe ALL database changes
const enhance = withObservables([], () => {
  console.log('📡 MonthlyTaskContext: Observing all daily tasks for reactive updates');

  return {
    // Observe ALL daily tasks - no filters, no date dependencies
    // This ensures reactive updates whenever ANY prayer/task data changes
    dailyTasks: database
      .get<DailyTasksModel>('daily_tasks')
      .query(Q.sortBy('date', Q.desc))
      .observe(),
  };
});

const EnhancedMonthlyTaskProvider = enhance(MonthlyTaskProviderInner);

// ✅ WRAPPER: Public interface component that accepts original props
export const MonthlyTaskProviderWrapper: React.FC<{
  children: React.ReactNode;
  userGoals?: UserGoals;
}> = ({children, userGoals}) => {
  return (
    <EnhancedMonthlyTaskProvider userGoals={userGoals}>
      {children}
    </EnhancedMonthlyTaskProvider>
  );
};

export const useMonthlyTask = () => {
  const context = useContext(MonthlyTaskContext);
  if (!context) {
    throw new Error('useMonthlyTask must be used within MonthlyTaskProvider');
  }
  return context;
};

// Export the wrapper as the main provider
export {MonthlyTaskProviderWrapper as MonthlyTaskProvider};
