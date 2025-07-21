import {Q} from '@nozbe/watermelondb';
import database from '.';
import DailyTasksModel, {PrayerStatus} from '../../model/DailyTasks';
import {getTodayDateString, formatDateString} from '../../utils/helpers';
import ApiTaskServices from '../apiHandler';

export interface DailyTaskData {
  date: string; // Primary key
  fajrStatus: PrayerStatus;
  dhuhrStatus: PrayerStatus;
  asrStatus: PrayerStatus;
  maghribStatus: PrayerStatus;
  ishaStatus: PrayerStatus;
  totalZikrCount: number;
  quranMinutes: number;
  specialTasks: any[];
}

export interface SpecialTask {
  id: string;
  title: string;
  completed: boolean;
}

const DEFAULT_DAILY_TASKS: Omit<DailyTaskData, 'date'> = {
  fajrStatus: 'none',
  dhuhrStatus: 'none',
  asrStatus: 'none',
  maghribStatus: 'none',
  ishaStatus: 'none',
  totalZikrCount: 0,
  quranMinutes: 0,
  specialTasks: [], // ✅ SIMPLIFIED: No default special tasks
};

// Use real API service
const apiService = ApiTaskServices.getInstance();
/**
 * Get recent daily tasks for a user
 */
export const getRecentDailyTasks = async (
  daysBack: number = 3,
): Promise<DailyTaskData[]> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
    const today = getTodayDateString();

    // Generate all dates in range (past days, today, and future days)
    const allDates = [];

    // For 3 days: Get day before yesterday, yesterday, today in chronological order
    if (daysBack === 3) {
      // Day before yesterday
      const dayBeforeYesterday = new Date();
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
      allDates.push(formatDateString(dayBeforeYesterday));

      // Yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      allDates.push(formatDateString(yesterday));

      // Today
      allDates.push(today);
    } else {
      // Original logic for other cases
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        allDates.push(formatDateString(date));
      }
    }

    // Calculate start and end dates for query
    const startDate =
      allDates[0] < allDates[allDates.length - 1]
        ? allDates[0]
        : allDates[allDates.length - 1];
    const endDate =
      allDates[0] > allDates[allDates.length - 1]
        ? allDates[0]
        : allDates[allDates.length - 1];

    // Query for the date range
    const tasks = await dailyTasksCollection
      .query(
        // Q.where('date', Q.gte(startDate)),
        // Q.where('date', Q.lte(endDate)),
        Q.sortBy('date', Q.desc),
      )
      .fetch();

    // Transform to DailyTaskData format
    const transformedTasks = tasks.map(task => ({
      date: task.date,
      fajrStatus: task.fajrStatus as PrayerStatus,
      dhuhrStatus: task.dhuhrStatus as PrayerStatus,
      asrStatus: task.asrStatus as PrayerStatus,
      maghribStatus: task.maghribStatus as PrayerStatus,
      ishaStatus: task.ishaStatus as PrayerStatus,
      totalZikrCount: task.totalZikrCount,
      quranMinutes: task.quranMinutes || 0,
      specialTasks: task.specialTasks
        ? (JSON.parse(task.specialTasks) as SpecialTask[])
        : [],
    }));

    // Check if today's task exists and create if needed
    const todayTask = transformedTasks.find(task => task.date === today);
    if (!todayTask) {
      console.log(`📝 Creating today's task for ${today}`);
      const newTodayTask = await createDailyTasks(today);
      transformedTasks.unshift(newTodayTask);
    }

    // Create complete task list with placeholders for missing dates
    const completeTasks = allDates.map(date => {
      const existingTask = transformedTasks.find(task => task.date === date);
      return (
        existingTask || {
          date,
          fajrStatus: 'none' as PrayerStatus,
          dhuhrStatus: 'none' as PrayerStatus,
          asrStatus: 'none' as PrayerStatus,
          maghribStatus: 'none' as PrayerStatus,
          ishaStatus: 'none' as PrayerStatus,
          totalZikrCount: 0,
          quranMinutes: 0,
          specialTasks: [],
        }
      );
    });

    return completeTasks;
  } catch (error) {
    console.error('Error getting recent daily tasks:', error);
    throw error;
  }
};

/**
 * Create daily tasks for a specific date
 */
export const createDailyTasks = async (
  date: string,
): Promise<DailyTaskData> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const newDailyTask = await database.write(async () => {
      const newTask = await dailyTasksCollection.create(task => {
        task.date = date;
        task.fajrStatus = DEFAULT_DAILY_TASKS.fajrStatus || 'none';
        task.dhuhrStatus = DEFAULT_DAILY_TASKS.dhuhrStatus || 'none';
        task.asrStatus = DEFAULT_DAILY_TASKS.asrStatus || 'none';
        task.maghribStatus = DEFAULT_DAILY_TASKS.maghribStatus || 'none';
        task.ishaStatus = DEFAULT_DAILY_TASKS.ishaStatus || 'none';
        task.totalZikrCount = DEFAULT_DAILY_TASKS.totalZikrCount;
        task.quranMinutes = DEFAULT_DAILY_TASKS.quranMinutes;
        task.specialTasks = JSON.stringify(DEFAULT_DAILY_TASKS.specialTasks); // Empty array
      });
      return newTask;
    });

    return {
      date: newDailyTask.date,
      fajrStatus: newDailyTask.fajrStatus as PrayerStatus,
      dhuhrStatus: newDailyTask.dhuhrStatus as PrayerStatus,
      asrStatus: newDailyTask.asrStatus as PrayerStatus,
      maghribStatus: newDailyTask.maghribStatus as PrayerStatus,
      ishaStatus: newDailyTask.ishaStatus as PrayerStatus,
      totalZikrCount: newDailyTask.totalZikrCount,
      quranMinutes: newDailyTask.quranMinutes || 0,
      specialTasks: JSON.parse(newDailyTask.specialTasks),
    };
  } catch (error) {
    console.error(`Error creating daily tasks for date ${date}:`, error);
    throw error;
  }
};

/**
 * Update prayer status - simplified and complete
 */
export const updatePrayerStatus = async (
  date: string,
  prayerName: string,
  status: PrayerStatus,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
    const lcPrayer = prayerName.toLowerCase();
    const today = getTodayDateString();

    // // Only allow updating today's prayers
    // if (date !== today) {
    //   throw new Error('Cannot update prayers for previous days');
    // }

    // Validate prayer name
    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(lcPrayer)) {
      throw new Error(`Invalid prayer name: ${prayerName}`);
    }

    // Find or create today's task
    let targetTask: DailyTasksModel;
    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();

    console.log(`🔍 Found ${existingTasks.length} tasks for date ${date}`);
    if (existingTasks.length === 0) {
      // Create new task for today
      console.log(`📝 Creating new task for ${date}`);
      targetTask = await database.write(async () => {
        return await dailyTasksCollection.create(task => {
          task.date = date;
          task.fajrStatus = 'none';
          task.dhuhrStatus = 'none';
          task.asrStatus = 'none';
          task.maghribStatus = 'none';
          task.ishaStatus = 'none';
          task.totalZikrCount = 0;
          task.quranMinutes = 0;
          task.specialTasks = JSON.stringify([]);
        });
      });
      console.log(`✅ Created new task with ID: ${targetTask.id}`);
    } else {
      targetTask = existingTasks[0];
      console.log(`📋 Using existing task with ID: ${targetTask.id}`);
    } // Update the specific prayer status using property assignment (not _setRaw)
    console.log(
      `🔧 Before update - ${lcPrayer}Status: ${
        (targetTask as any)[lcPrayer + 'Status']
      }`,
    );

    await database.write(async () => {
      await targetTask.update(task => {
        switch (lcPrayer) {
          case 'fajr':
            console.log(`✏️ Setting fajrStatus to: ${status}`);
            task.fajrStatus = status || 'none';
            break;
          case 'dhuhr':
            console.log(`✏️ Setting dhuhrStatus to: ${status}`);
            task.dhuhrStatus = status || 'none';
            break;
          case 'asr':
            console.log(`✏️ Setting asrStatus to: ${status}`);
            task.asrStatus = status || 'none';
            break;
          case 'maghrib':
            console.log(`✏️ Setting maghribStatus to: ${status}`);
            task.maghribStatus = status || 'none';
            break;
          case 'isha':
            console.log(`✏️ Setting ishaStatus to: ${status}`);
            task.ishaStatus = status || 'none';
            break;
        }
      });
    }); // Verify the update

    console.log(`✅ Updated ${lcPrayer} prayer to "${status}" for ${date}`);

    // API sync in background (optional)
    try {
      await apiService.updatePrayerStatus(date, prayerName, status);
      console.log(`🔄 Prayer ${prayerName} synced with server for ${status}`);
    } catch (apiError) {
      console.warn('⚠️ API sync failed for prayer update:', apiError);
    }
  } catch (error) {
    console.error('❌ Failed to update prayer status:', error);
    throw error;
  }
};

/**
 * Update zikr count
 */
export const updateZikrCount = async (
  date: string,
  count: number,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();
    await database.write(async () => {
      await existingTasks[0].update(task => {
        task.totalZikrCount = count;
      });
    });


     // API sync in background (optional)
    try {
      await apiService.updateZikrCount(date,count);
      console.log(`🔄 Zikr ${count} synced with server for ${date}`);
    } catch (apiError) {
      console.warn('⚠️ API sync failed for prayer update:', apiError);
    }

    console.log(`✅ Updated zikr count to ${count} for ${date}`);
  } catch (error) {
    console.error('Error updating zikr count:', error);
    throw error;
  }
};

/**
 * Update Quran minutes
 */
export const updateQuranMinutes = async (
  date: string,
  minutes: number,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();

    await database.write(async () => {
      await existingTasks[0].update(task => {
        task.quranMinutes = minutes;
      });
    });


      try {
      await apiService.updateQuranMinutes(date,minutes);
      console.log(`Quran ${minutes} synced with server for ${date}`);
    } catch (apiError) {
      console.warn('⚠️ API sync failed for prayer update:', apiError);
    }

    console.log(`✅ Updated Quran minutes for ${date}: ${minutes} minutes`);
  } catch (error) {
    console.error('Error updating Quran minutes:', error);
    throw error;
  }
};

/**
 * Update special task completion status with reactive updates
 */
export const updateSpecialTaskStatus = async (
  date: string,
  taskId: string,
  completed: boolean,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
    const today = getTodayDateString();

    // Only allow updating today's tasks
    if (date !== today) {
      throw new Error('Cannot update special tasks for previous days');
    }

    // Get existing task (assuming it exists)
    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();

    if (existingTasks.length === 0) {
      throw new Error(`No daily task found for date ${date}`);
    }

    const targetTask = existingTasks[0];

    // Update the specific special task
    await database.write(async () => {
      await targetTask.update(task => {
        const specialTasks: SpecialTask[] = task.specialTasks
          ? JSON.parse(task.specialTasks)
          : DEFAULT_DAILY_TASKS.specialTasks;

        const taskIndex = specialTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
          throw new Error(`Special task with ID "${taskId}" not found`);
        }

        specialTasks[taskIndex].completed = completed;
        task.specialTasks = JSON.stringify(specialTasks);
      });
    });

    console.log(
      `✅ Updated special task "${taskId}" to ${
        completed ? 'completed' : 'not completed'
      } for ${date}`,
    );
  } catch (error) {
    console.error('❌ Failed to update special task status:', error);
    throw error;
  }
};

/**
 * Get recent months data for statistics
 */
export const getRecentMonthsData = async (
  uid: number,
  monthsBack: number = 3,
): Promise<any[]> => {
  try {
    // This is a placeholder implementation
    // Replace with actual aggregation logic for monthly data

    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    // Calculate start date (first day of the month, monthsBack months ago)
    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthsBack + 1,
      1,
    );
    const startDateStr = formatDateString(startDate);

    // Get all tasks since that date
    const tasks = await dailyTasksCollection
      .query(Q.where('date', Q.gte(startDateStr)), Q.sortBy('date', Q.asc))
      .fetch();

    // Transform to monthly aggregated data
    // Group by month and calculate statistics
    const monthlyData = [];
    const monthGroups: {[key: string]: any[]} = {};

    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      const monthKey = `${taskDate.getFullYear()}-${taskDate.getMonth() + 1}`;

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }

      monthGroups[monthKey].push(task);
    });

    // Calculate statistics for each month
    for (const [monthKey, monthTasks] of Object.entries(monthGroups)) {
      const [year, month] = monthKey.split('-');

      const monthName = new Date(
        Number(year),
        Number(month) - 1,
      ).toLocaleString('default', {month: 'long'});

      const totalPrayers = monthTasks.length * 5; // 5 prayers per day
      const completedPrayers = monthTasks.reduce((sum, task) => {
        return (
          sum +
          // FIX: Check for 'home' and 'mosque' instead of 'done'
          (task.fajrStatus === 'home' || task.fajrStatus === 'mosque' ? 1 : 0) +
          (task.dhuhrStatus === 'home' || task.dhuhrStatus === 'mosque'
            ? 1
            : 0) +
          (task.asrStatus === 'home' || task.asrStatus === 'mosque' ? 1 : 0) +
          (task.maghribStatus === 'home' || task.maghribStatus === 'mosque'
            ? 1
            : 0) +
          (task.ishaStatus === 'home' || task.ishaStatus === 'mosque' ? 1 : 0)
        );
      }, 0);
      const totalQuranMinutes = monthTasks.reduce(
        (sum, task) => sum + (task.quranMinutes || 0),
        0,
      );

      const totalZikrCount = monthTasks.reduce(
        (sum, task) => sum + (task.totalZikrCount || 0),
        0,
      );

      // Count Fajr and Isha completed days
      const fajrCompletedDays = monthTasks.filter(
        task => task.fajrStatus === 'home' || task.fajrStatus === 'mosque',
      ).length;

      const ishaCompletedDays = monthTasks.filter(
        task => task.ishaStatus === 'home' || task.ishaStatus === 'mosque',
      ).length;

      monthlyData.push({
        monthName: monthName,
        year: Number(year),
        totalZikr: totalZikrCount,
        totalQuranPages: Math.floor(totalQuranMinutes / 15),
        fajrCompletedDays,
        ishaCompletedDays,
        totalDays: monthTasks.length,
        prayerCompletionRate:
          totalPrayers > 0 ? (completedPrayers / totalPrayers) * 100 : 0,
        avgQuranMinutes:
          monthTasks.length > 0 ? totalQuranMinutes / monthTasks.length : 0,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly data:', error);
    throw error;
  }
};
