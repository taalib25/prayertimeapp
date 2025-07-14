import {useCallback, useMemo, useState, useEffect} from 'react';
import {Q} from '@nozbe/watermelondb';
import database from '../services/db';
import DailyTasksModel, {PrayerStatus} from '../model/DailyTasks';
import {getTodayDateString, formatDateString} from '../utils/helpers';
import ApiTaskServices from '../services/apiHandler';
import {getRecentMonthsData} from '../services/db/dailyTaskServices';
import {dataCache} from '../utils/dataCache';

/**
 * Enhanced WatermelonDB hook for reactive daily tasks
 * Uses direct API calls after database updates for server synchronization
 * Fixed to properly trigger reactive updates across all components
 */
export const useDailyTasks = (daysBack: number = 30) => {
  const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
  const apiService = ApiTaskServices.getInstance();

  // State for tasks
  const [dailyTasks, setDailyTasks] = useState<DailyTasksModel[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTasksModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Add trigger for forced updates

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

  // Fetch daily tasks
  const fetchDailyTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const tasks = await dailyTasksCollection
        .query(
          Q.where('date', Q.gte(dateRange.startDate)),
          Q.where('date', Q.lte(dateRange.endDate)),
          Q.sortBy('date', Q.desc),
        )
        .fetch();

      setDailyTasks(tasks);

      // Get today's tasks
      const todayTasksData = await dailyTasksCollection
        .query(
          Q.where('date', Q.eq(dateRange.todayDate)),
          Q.sortBy('date', Q.desc),
        )
        .fetch();

      setTodayTasks(todayTasksData);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dailyTasksCollection, dateRange, updateTrigger]); // Add updateTrigger as dependency

  // Load data on mount and date range changes
  useEffect(() => {
    fetchDailyTasks();
  }, [fetchDailyTasks]);

  // Force update trigger function
  const triggerUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
    dataCache.clear(); // Clear cache to ensure fresh data
    console.log('🔄 Triggered global reactive update and cleared cache');
  }, []);

  // Update prayer status with automatic sync and reactive updates
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
            const newTask = await dailyTasksCollection.create(
              (task: DailyTasksModel) => {
                task.date = date;
                task.totalZikrCount = 0;
                task.quranMinutes = 0;
                task.specialTasks = JSON.stringify([]);

                // Set prayer status
                const statusValue = status || 'none';
                task.fajrStatus = prayerName === 'fajr' ? statusValue : 'none';
                task.dhuhrStatus =
                  prayerName === 'dhuhr' ? statusValue : 'none';
                task.asrStatus = prayerName === 'asr' ? statusValue : 'none';
                task.maghribStatus =
                  prayerName === 'maghrib' ? statusValue : 'none';
                task.ishaStatus = prayerName === 'isha' ? statusValue : 'none';
              },
            );
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

        // Trigger reactive updates FIRST before API call
        triggerUpdate();

        // Then refresh local data
        await fetchDailyTasks();

        // Finally, sync with server in background
        try {
          await apiService.updatePrayerStatus(date, prayerName, status);
          console.log(`✅ Prayer ${prayerName} synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for prayer update:', apiError);
          // Continue - local update succeeded, API sync will retry later
        }
      } catch (error) {
        console.error('Error updating prayer status:', error);
      }
    },
    [dailyTasksCollection, fetchDailyTasks, apiService, triggerUpdate],
  );

  // Update Quran minutes with automatic sync and reactive updates
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

        // Trigger reactive updates FIRST before API call
        triggerUpdate();

        // Then refresh local data
        await fetchDailyTasks();

        // Finally, sync with server in background
        try {
          await apiService.updateQuranMinutes(date, minutes);
          console.log(`✅ Quran minutes synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for Quran update:', apiError);
          // Continue - local update succeeded, API sync will retry later
        }
      } catch (error) {
        console.error('Error updating Quran minutes:', error);
      }
    },
    [dailyTasksCollection, fetchDailyTasks, apiService, triggerUpdate],
  );

  // Update Zikr count with automatic sync and reactive updates
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
              task.quranMinutes = 0;
              task.totalZikrCount = count;
              task.specialTasks = JSON.stringify([]);
            });
          } else {
            // Update existing task
            await task[0].update((task: DailyTasksModel) => {
              task.totalZikrCount = count;
            });
          }
        });

        // Trigger reactive updates FIRST before API call
        triggerUpdate();

        // Then refresh local data
        await fetchDailyTasks();

        // Finally, sync with server in background
        try {
          await apiService.updateZikrCount(date, count);
          console.log(`✅ Zikr count synced with server for ${date}`);
        } catch (apiError) {
          console.warn('⚠️ API sync failed for Zikr update:', apiError);
          // Continue - local update succeeded, API sync will retry later
        }
      } catch (error) {
        console.error('Error updating Zikr count:', error);
      }
    },
    [dailyTasksCollection, fetchDailyTasks, apiService, triggerUpdate],
  );

  // Update special task status with automatic reactive updates
  const updateSpecialTask = useCallback(
    async (date: string, taskId: string, completed: boolean) => {
      try {
        console.log(
          `🔄 Updating special task: ${taskId} = ${completed} for ${date}`,
        );

        await database.write(async () => {
          let task = await dailyTasksCollection
            .query(Q.where('date', Q.eq(date)))
            .fetch();

          if (task.length === 0) {
            // Create new task if it doesn't exist
            await dailyTasksCollection.create((task: DailyTasksModel) => {
              task.date = date;
              task.quranMinutes = 0;
              task.totalZikrCount = 0;
              const specialTasks = [{id: taskId, title: '', completed}];
              task.specialTasks = JSON.stringify(specialTasks);
            });
          } else {
            // Update existing task
            await task[0].update((task: DailyTasksModel) => {
              const specialTasks = task.specialTasks
                ? JSON.parse(task.specialTasks)
                : [];

              const taskIndex = specialTasks.findIndex(
                (t: any) => t.id === taskId,
              );
              if (taskIndex >= 0) {
                specialTasks[taskIndex].completed = completed;
              } else {
                specialTasks.push({id: taskId, title: '', completed});
              }

              task.specialTasks = JSON.stringify(specialTasks);
            });
          }
        });

        // Trigger reactive updates FIRST before API call
        triggerUpdate();

        // Then refresh local data
        await fetchDailyTasks();

        console.log(
          `✅ Special task "${taskId}" updated with reactive updates`,
        );
      } catch (error) {
        console.error('Error updating special task:', error);
      }
    },
    [dailyTasksCollection, fetchDailyTasks, triggerUpdate],
  );

  // Get task for specific date
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

  // Transform WatermelonDB models to plain objects for UI compatibility
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
    // Data
    dailyTasks: dailyTasksData,
    dailyTasksModels: dailyTasks,
    todayTasks,
    isLoading,
    updateTrigger, // Expose trigger for other components that need reactivity

    // Update methods with automatic sync
    updatePrayerStatus,
    updateQuranMinutes,
    updateZikrCount,
    updateSpecialTask,

    // Utility methods
    getTaskForDate,
    refresh: fetchDailyTasks,
    triggerUpdate, // Expose trigger function
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
