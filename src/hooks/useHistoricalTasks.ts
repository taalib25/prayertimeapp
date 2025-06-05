import {useState, useEffect, useCallback, useMemo} from 'react';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';

// Define what columns/data we can analyze
export interface HistoricalDataPoint {
  date: string;
  prayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  specialTasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  zikrCount: number;
  // Add computed fields
  totalPrayersCompleted?: number;
  totalSpecialTasksCompleted?: number;
  completionPercentage?: number;
}

// Configuration for what data to analyze
export interface HistoricalAnalysisConfig {
  // Date range
  daysBack: number;
  endDate?: string; // Default to today

  // What to include in analysis
  includePrayers?: boolean;
  includeSpecialTasks?: boolean;
  includeZikr?: boolean;

  // Specific columns to focus on
  prayerColumns?: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>;
  specialTaskIds?: string[]; // Analyze specific tasks only

  // Aggregation options
  calculateTotals?: boolean;
  calculateAverages?: boolean;
  calculateStreaks?: boolean;
}

// Analysis results
export interface HistoricalAnalysis {
  rawData: HistoricalDataPoint[];

  // Totals
  totalDays: number;
  totalPrayers: number;
  totalPrayersCompleted: number;
  totalSpecialTasks: number;
  totalSpecialTasksCompleted: number;
  totalZikr: number;

  // Averages
  avgPrayersPerDay: number;
  avgSpecialTasksPerDay: number;
  avgZikrPerDay: number;
  avgCompletionRate: number;

  // Streaks
  currentPrayerStreak: number;
  longestPrayerStreak: number;
  currentSpecialTaskStreak: number;
  longestSpecialTaskStreak: number;

  // Per-prayer analysis
  prayerStats: {
    [key in 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha']: {
      completed: number;
      total: number;
      percentage: number;
      currentStreak: number;
      longestStreak: number;
    };
  };

  // Per-task analysis
  specialTaskStats: {
    [taskId: string]: {
      title: string;
      completed: number;
      total: number;
      percentage: number;
      currentStreak: number;
      longestStreak: number;
    };
  };
}

interface UseHistoricalTasksProps {
  uid: number;
  config: HistoricalAnalysisConfig;
}

export const useHistoricalTasks = ({uid, config}: UseHistoricalTasksProps) => {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<HistoricalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate date range based on config
  const dateRange = useMemo(() => {
    const endDate = config.endDate ? new Date(config.endDate) : new Date();
    const dates: string[] = [];

    for (let i = 0; i < config.daysBack; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates.reverse(); // Oldest first
  }, [config.daysBack, config.endDate]);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

      // Build query for date range and user
      const startDate = dateRange[0];
      const endDate = dateRange[dateRange.length - 1];

      const tasks = await dailyTasksCollection
        .query(
          Q.where('user_id', uid),
          Q.where('date', Q.gte(startDate)),
          Q.where('date', Q.lte(endDate)),
          Q.sortBy('date', Q.asc),
        )
        .fetch();

      // Convert to HistoricalDataPoint format
      const historicalData: HistoricalDataPoint[] = dateRange.map(date => {
        const dayTask = tasks.find(task => task.date === date);

        if (!dayTask) {
          // No data for this day - return empty/default values
          return {
            date,
            prayers: {
              fajr: false,
              dhuhr: false,
              asr: false,
              maghrib: false,
              isha: false,
            },
            specialTasks: [],
            zikrCount: 0,
            totalPrayersCompleted: 0,
            totalSpecialTasksCompleted: 0,
            completionPercentage: 0,
          };
        }

        // Parse the data from the model
        const prayers = {
          fajr: dayTask.fajrStatus === 'completed',
          dhuhr: dayTask.dhuhrStatus === 'completed',
          asr: dayTask.asrStatus === 'completed',
          maghrib: dayTask.maghribStatus === 'completed',
          isha: dayTask.ishaStatus === 'completed',
        };

        const specialTasks = Array.isArray(dayTask.specialTasks)
          ? dayTask.specialTasks
          : dayTask.specialTasks
          ? JSON.parse(dayTask.specialTasks as string)
          : [];

        const zikrCount = dayTask.totalZikrCount || 0;

        // Calculate computed fields
        const totalPrayersCompleted =
          Object.values(prayers).filter(Boolean).length;
        const totalSpecialTasksCompleted = specialTasks.filter(
          (task: any) => task.completed,
        ).length;
        const totalTasks = 5 + specialTasks.length; // 5 prayers + special tasks
        const completionPercentage =
          totalTasks > 0
            ? ((totalPrayersCompleted + totalSpecialTasksCompleted) /
                totalTasks) *
              100
            : 0;

        return {
          date,
          prayers,
          specialTasks,
          zikrCount,
          totalPrayersCompleted,
          totalSpecialTasksCompleted,
          completionPercentage,
        };
      });

      setData(historicalData);
    } catch (err) {
      setError('Failed to fetch historical data');
      console.error('Error fetching historical tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, dateRange]);

  // Calculate streaks
  const calculateStreak = useCallback(
    (
      values: boolean[],
      reverse = false,
    ): {current: number; longest: number} => {
      if (values.length === 0) return {current: 0, longest: 0};

      const array = reverse ? [...values].reverse() : values;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate longest streak
      for (const value of array) {
        if (value) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Calculate current streak (from most recent)
      for (let i = array.length - 1; i >= 0; i--) {
        if (array[i]) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {current: currentStreak, longest: longestStreak};
    },
    [],
  );

  // Analyze the data
  const analyzeData = useCallback((): HistoricalAnalysis => {
    if (data.length === 0) {
      // Return empty analysis
      const emptyPrayerStats = {
        fajr: {
          completed: 0,
          total: 0,
          percentage: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        dhuhr: {
          completed: 0,
          total: 0,
          percentage: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        asr: {
          completed: 0,
          total: 0,
          percentage: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        maghrib: {
          completed: 0,
          total: 0,
          percentage: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        isha: {
          completed: 0,
          total: 0,
          percentage: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      };

      return {
        rawData: [],
        totalDays: 0,
        totalPrayers: 0,
        totalPrayersCompleted: 0,
        totalSpecialTasks: 0,
        totalSpecialTasksCompleted: 0,
        totalZikr: 0,
        avgPrayersPerDay: 0,
        avgSpecialTasksPerDay: 0,
        avgZikrPerDay: 0,
        avgCompletionRate: 0,
        currentPrayerStreak: 0,
        longestPrayerStreak: 0,
        currentSpecialTaskStreak: 0,
        longestSpecialTaskStreak: 0,
        prayerStats: emptyPrayerStats,
        specialTaskStats: {},
      };
    }

    const totalDays = data.length;
    const totalPrayers = totalDays * 5; // 5 prayers per day
    const totalPrayersCompleted = data.reduce(
      (sum, day) => sum + (day.totalPrayersCompleted || 0),
      0,
    );
    const totalSpecialTasksCompleted = data.reduce(
      (sum, day) => sum + (day.totalSpecialTasksCompleted || 0),
      0,
    );
    const totalZikr = data.reduce((sum, day) => sum + day.zikrCount, 0);

    // Calculate prayer-specific stats
    const prayerNames: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'> = [
      'fajr',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ];

    const prayerStats = prayerNames.reduce((stats, prayerName) => {
      const prayerData = data.map(day => day.prayers[prayerName]);
      const completed = prayerData.filter(Boolean).length;
      const streaks = calculateStreak(prayerData);

      stats[prayerName] = {
        completed,
        total: totalDays,
        percentage: totalDays > 0 ? (completed / totalDays) * 100 : 0,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
      };

      return stats;
    }, {} as HistoricalAnalysis['prayerStats']);

    // Calculate special task stats
    const allSpecialTaskIds = Array.from(
      new Set(data.flatMap(day => day.specialTasks.map(task => task.id))),
    );

    const specialTaskStats = allSpecialTaskIds.reduce((stats, taskId) => {
      const taskData = data.map(day => {
        const task = day.specialTasks.find(t => t.id === taskId);
        return task ? task.completed : false;
      });

      const task = data
        .flatMap(day => day.specialTasks)
        .find(t => t.id === taskId);

      const completed = taskData.filter(Boolean).length;
      const streaks = calculateStreak(taskData);

      stats[taskId] = {
        title: task?.title || `Task ${taskId}`,
        completed,
        total: totalDays,
        percentage: totalDays > 0 ? (completed / totalDays) * 100 : 0,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
      };

      return stats;
    }, {} as HistoricalAnalysis['specialTaskStats']);

    // Calculate overall streaks
    const dailyPrayerCompletion = data.map(
      day => (day.totalPrayersCompleted || 0) === 5,
    );
    const prayerStreaks = calculateStreak(dailyPrayerCompletion);

    const dailySpecialTaskCompletion = data.map(
      day =>
        day.specialTasks.length > 0 &&
        day.specialTasks.every(task => task.completed),
    );
    const specialTaskStreaks = calculateStreak(dailySpecialTaskCompletion);

    const totalSpecialTasks = data.reduce(
      (sum, day) => sum + day.specialTasks.length,
      0,
    );

    return {
      rawData: data,
      totalDays,
      totalPrayers,
      totalPrayersCompleted,
      totalSpecialTasks,
      totalSpecialTasksCompleted,
      totalZikr,
      avgPrayersPerDay: totalDays > 0 ? totalPrayersCompleted / totalDays : 0,
      avgSpecialTasksPerDay:
        totalDays > 0 ? totalSpecialTasksCompleted / totalDays : 0,
      avgZikrPerDay: totalDays > 0 ? totalZikr / totalDays : 0,
      avgCompletionRate:
        data.reduce((sum, day) => sum + (day.completionPercentage || 0), 0) /
        totalDays,
      currentPrayerStreak: prayerStreaks.current,
      longestPrayerStreak: prayerStreaks.longest,
      currentSpecialTaskStreak: specialTaskStreaks.current,
      longestSpecialTaskStreak: specialTaskStreaks.longest,
      prayerStats,
      specialTaskStats,
    };
  }, [data, calculateStreak]);

  // Update analysis when data changes
  useEffect(() => {
    if (!isLoading && data.length >= 0) {
      const analysisResult = analyzeData();
      setAnalysis(analysisResult);
    }
  }, [data, isLoading, analyzeData]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Helper functions for easy data access
  const getFilteredData = useCallback(
    (filterFn: (day: HistoricalDataPoint) => boolean) => {
      return data.filter(filterFn);
    },
    [data],
  );

  const getPrayerData = useCallback(
    (prayerName: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
      return data.map(day => ({
        date: day.date,
        completed: day.prayers[prayerName],
      }));
    },
    [data],
  );

  const getSpecialTaskData = useCallback(
    (taskId: string) => {
      return data.map(day => {
        const task = day.specialTasks.find(t => t.id === taskId);
        return {
          date: day.date,
          completed: task ? task.completed : false,
        };
      });
    },
    [data],
  );

  return {
    // Core data
    data,
    analysis,
    isLoading,
    error,

    // Helper functions
    refetch: fetchHistoricalData,
    getFilteredData,
    getPrayerData,
    getSpecialTaskData,

    // Configuration
    config,
    dateRange,
  };
};
