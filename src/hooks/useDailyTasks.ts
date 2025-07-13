import {useCallback, useMemo, useState, useEffect} from 'react';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel, {PrayerStatus} from '../model/DailyTasks';
import {getTodayDateString, formatDateString} from '../utils/helpers';
import ApiTaskServices from '../services/apiHandler';
import {getRecentMonthsData} from '../services/db/dailyTaskServices';

/**
 * ✅ FIXED: Proper WatermelonDB reactive hook using observables
 * This ensures all components automatically update when database changes
 */
export const useDailyTasks = (daysBack: number = 30) => {
  const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
  const apiService = ApiTaskServices.getInstance();

  // ✅ REACTIVE: Use WatermelonDB observables instead of useState
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Date range calculation
  const dateRange = useMemo(() => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysBack);

    return {
      startDate: formatDateString(startDate),
      endDate: formatDateString(today),
      todayDate: getTodayDateString(),
    };
  }, [daysBack]);

  // ✅ REACTIVE: Create WatermelonDB query that will be observed
  const dailyTasksQuery = useMemo(() => {
    return dailyTasksCollection.query(
      Q.where('date', Q.gte(dateRange.startDate)),
      Q.where('date', Q.lte(dateRange.endDate)),
      Q.sortBy('date', Q.desc),
    );
  }, [dailyTasksCollection, dateRange.startDate, dateRange.endDate]);

  const todayTasksQuery = useMemo(() => {
    return dailyTasksCollection.query(
      Q.where('date', Q.eq(dateRange.todayDate)),
      Q.sortBy('date', Q.desc),
    );
  }, [dailyTasksCollection, dateRange.todayDate]);

  // ✅ REACTIVE: This will hold the observable data
  const [dailyTasks, setDailyTasks] = useState<DailyTasksModel[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTasksModel[]>([]);

  // ✅ REACTIVE: Subscribe to WatermelonDB observables
  useEffect(() => {
    console.log('🔄 Setting up WatermelonDB reactive subscriptions...');

    // Subscribe to daily tasks changes
    const dailyTasksSubscription = dailyTasksQuery.observe().subscribe({
      next: tasks => {
        console.log(`📊 Reactive update: ${tasks.length} daily tasks received`);
        setDailyTasks(tasks);
        setIsLoading(false);
      },
      error: error => {
        console.error('❌ Error in daily tasks subscription:', error);
        setIsLoading(false);
      },
    });

    // Subscribe to today's tasks changes
    const todayTasksSubscription = todayTasksQuery.observe().subscribe({
      next: tasks => {
        console.log(`📋 Reactive update: ${tasks.length} today tasks received`);
        setTodayTasks(tasks);
      },
      error: error => {
        console.error('❌ Error in today tasks subscription:', error);
      },
    });

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up WatermelonDB subscriptions');
      dailyTasksSubscription.unsubscribe();
      todayTasksSubscription.unsubscribe();
    };
  }, [dailyTasksQuery, todayTasksQuery]);

  // Force update trigger function (for manual refresh if needed)
  const triggerUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
    console.log('🔄 Manual reactive update triggered');
  }, []);

  // ✅ REACTIVE: Update prayer status with WatermelonDB automatic reactivity
  const updatePrayerStatus = useCallback(
    async (date: string, prayerName: string, status: PrayerStatus) => {
      try {
        console.log(
          `🔄 Updating prayer status: ${prayerName} = ${status} for ${date}`,
        );

        await database.write(async () => {
          let task = await dailyTasksCollection
            .query(Q.where('date', Q.eq(date)))
            .fetch();

          if (task.length === 0) {
            // Create new task
            await dailyTasksCollection.create((task: DailyTasksModel) => {
              task.date = date;
              task.totalZikrCount = 0;
              task.quranMinutes = 0;
              task.specialTasks = JSON.stringify([]);

              // Set prayer status
              const statusValue = status || 'none';
              task.fajrStatus = prayerName === 'fajr' ? statusValue : 'none';
              task.dhuhrStatus = prayerName === 'dhuhr' ? statusValue : 'none';
              task.asrStatus = prayerName === 'asr' ? statusValue : 'none';
              task.maghribStatus =
                prayerName === 'maghrib' ? statusValue : 'none';
              task.ishaStatus = prayerName === 'isha' ? statusValue : 'none';
            });
          } else {
            // Update existing task
            await task[0].update((task: DailyTasksModel) => {
              const statusValue = status || 'none';
              task.fajrStatus =
                prayerName === 'fajr' ? statusValue : task.fajrStatus;
              task.dhuhrStatus =
                prayerName === 'dhuhr' ? statusValue : task.dhuhrStatus;
              task.asrStatus =
                prayerName === 'asr' ? statusValue : task.asrStatus;
              task.maghribStatus =
                prayerName === 'maghrib' ? statusValue : task.maghribStatus;
              task.ishaStatus =
                prayerName === 'isha' ? statusValue : task.ishaStatus;
            });
          }
        });

        // ✅ REACTIVE: WatermelonDB automatically triggers reactive updates
        console.log(`✅ Prayer ${prayerName} updated reactively for ${date}`);

        // API sync in background (optional)
        try {
          await apiService.updatePrayerStatus(date, prayerName, status);
          console.log(`🔄 Prayer ${prayerName} synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for prayer update:', apiError);
        }
      } catch (error) {
        console.error('Error updating prayer status:', error);
      }
    },
    [dailyTasksCollection, apiService],
  );
  // ✅ REACTIVE: Update Quran minutes with WatermelonDB automatic reactivity
  const updateQuranMinutes = useCallback(
    async (date: string, minutes: number) => {
      try {
        console.log(`🔄 Updating Quran minutes: ${minutes} for ${date}`);

        await database.write(async () => {
          let task = await dailyTasksCollection
            .query(Q.where('date', Q.eq(date)))
            .fetch();

          if (task.length === 0) {
            // Create new task
            await dailyTasksCollection.create((task: DailyTasksModel) => {
              task.date = date;
              task.quranMinutes = minutes;
              task.totalZikrCount = 0;
              task.specialTasks = JSON.stringify([]);
            });
          } else {
            // Update existing task
            await task[0].update((task: DailyTasksModel) => {
              task.quranMinutes = minutes;
            });
          }
        });

        // ✅ REACTIVE: WatermelonDB automatically triggers reactive updates
        console.log(`✅ Quran minutes updated reactively for ${date}`);

        // API sync in background (optional)
        try {
          await apiService.updateQuranMinutes(date, minutes);
          console.log(`🔄 Quran minutes synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for Quran update:', apiError);
        }
      } catch (error) {
        console.error('Error updating Quran minutes:', error);
      }
    },
    [dailyTasksCollection, apiService],
  );

  // ✅ REACTIVE: Update Zikr count with WatermelonDB automatic reactivity
  const updateZikrCount = useCallback(
    async (date: string, count: number) => {
      try {
        console.log(`🔄 Updating Zikr count: ${count} for ${date}`);

        await database.write(async () => {
          let task = await dailyTasksCollection
            .query(Q.where('date', Q.eq(date)))
            .fetch();

          if (task.length === 0) {
            // Create new task
            await dailyTasksCollection.create((task: DailyTasksModel) => {
              task.date = date;
              task.totalZikrCount = count;
              task.quranMinutes = 0;
              task.specialTasks = JSON.stringify([]);
            });
          } else {
            // Update existing task
            await task[0].update((task: DailyTasksModel) => {
              task.totalZikrCount = count;
            });
          }
        });

        // ✅ REACTIVE: WatermelonDB automatically triggers reactive updates
        console.log(`✅ Zikr count updated reactively for ${date}`);

        // API sync in background (optional)
        try {
          await apiService.updateZikrCount(date, count);
          console.log(`🔄 Zikr count synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for Zikr update:', apiError);
        }
      } catch (error) {
        console.error('Error updating Zikr count:', error);
      }
    },
    [dailyTasksCollection, apiService],
  );

  // ✅ REACTIVE: Get task for specific date
  const getTaskForDate = useCallback(
    (date: string) => {
      const task = dailyTasks.find(
        (task: DailyTasksModel) => task.date === date,
      );
      if (!task) return null;

      return {
        id: task.id,
        date: task.date,
        quran_minutes: task.quranMinutes,
        zikr_count: task.totalZikrCount,
        special_tasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
        created_at: task.createdAt,
        updated_at: task.updatedAt,
        fajrStatus: task.fajrStatus,
        dhuhrStatus: task.dhuhrStatus,
        asrStatus: task.asrStatus,
        maghribStatus: task.maghribStatus,
        ishaStatus: task.ishaStatus,
        quranMinutes: task.quranMinutes,
        totalZikrCount: task.totalZikrCount,
      };
    },
    [dailyTasks],
  );

  // ✅ REACTIVE: Transform WatermelonDB models to plain objects for UI compatibility
  const dailyTasksData = useMemo(() => {
    return dailyTasks.map((task: DailyTasksModel) => ({
      id: task.id,
      date: task.date,
      quran_minutes: task.quranMinutes,
      zikr_count: task.totalZikrCount,
      special_tasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
      specialTasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      fajrStatus: task.fajrStatus as PrayerStatus,
      dhuhrStatus: task.dhuhrStatus as PrayerStatus,
      asrStatus: task.asrStatus as PrayerStatus,
      maghribStatus: task.maghribStatus as PrayerStatus,
      ishaStatus: task.ishaStatus as PrayerStatus,
      quranMinutes: task.quranMinutes,
      totalZikrCount: task.totalZikrCount,
    }));
  }, [dailyTasks]);

  return {
    // ✅ REACTIVE: Data from WatermelonDB observables
    dailyTasks: dailyTasksData,
    dailyTasksModels: dailyTasks,
    todayTasks,
    isLoading,
    updateTrigger, // Expose trigger for other components that need reactivity

    // ✅ REACTIVE: Update methods with automatic reactivity
    updatePrayerStatus,
    updateQuranMinutes,
    updateZikrCount,

    // Utility methods
    getTaskForDate,
    refresh: () => {
      // No need for manual refresh - reactive subscriptions handle it
      console.log(
        '🔄 Refresh called - reactive subscriptions handle updates automatically',
      );
    },
    triggerUpdate, // Expose trigger function for manual updates if needed
  };
};

/**
 * Hook to get tasks for a specific date
 */
export const useDailyTasksForDate = (date: string) => {
  const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
  const [dailyTasks, setDailyTasks] = useState<DailyTasksModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const tasks = await dailyTasksCollection
        .query(Q.where('date', Q.eq(date)), Q.sortBy('date', Q.desc))
        .fetch();

      setDailyTasks(tasks);
    } catch (error) {
      console.error('Error fetching tasks for date:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dailyTasksCollection, date]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Transform WatermelonDB models to plain objects for UI compatibility
  const dailyTasksData = useMemo(() => {
    return dailyTasks.map((task: DailyTasksModel) => ({
      id: task.id,
      date: task.date,
      quran_minutes: task.quranMinutes,
      zikr_count: task.totalZikrCount,
      special_tasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    }));
  }, [dailyTasks]);

  return {
    dailyTasks: dailyTasksData,
    dailyTasksModels: dailyTasks,
    isLoading,
    refresh: fetchTasks,
  };
};

/**
 * Hook to get monthly aggregated data with WatermelonDB
 */
export const useMonthlyTasksData = (uid: number, monthsBack: number = 3) => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 Fetching monthly aggregated data...');
      const data = await getRecentMonthsData(uid, monthsBack);
      setMonthlyData(data);
    } catch (err) {
      setError('Failed to fetch monthly data');
      console.error('Error fetching monthly data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, monthsBack]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return {
    monthlyData,
    isLoading,
    error,
    refetch: fetchMonthlyData,
  };
};
export default useDailyTasks;
