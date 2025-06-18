import {Q} from '@nozbe/watermelondb';
import database from '.';
import DailyTasksModel, {PrayerStatus} from '../../model/DailyTasks';

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
  specialTasks: [
    {id: 't1', title: 'Fajr at Masjid', completed: false},
    {id: 't2', title: '100 x Dhikr', completed: false},
    {id: 't3', title: 'Read Quran', completed: false},
  ],
};

/**
 * Get recent daily tasks for a user
 */
export const getRecentDailyTasks = async (
  daysBack: number = 3,
): Promise<DailyTaskData[]> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    // Calculate the date range
    const endDate = new Date().toISOString().split('T')[0]; // Today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysBack - 1));
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query for the date range
    const tasks = await dailyTasksCollection
      .query(
        Q.where('date', Q.gte(startDateStr)),
        Q.where('date', Q.lte(endDate)),
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

    // Generate all dates in range
    const allDates = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.push(date.toISOString().split('T')[0]);
    }

    const today = new Date().toISOString().split('T')[0];

    // Create placeholders for missing dates and await all promises
    const tasksPromises = allDates.map(async date => {
      const existingTask = transformedTasks.find(task => task.date === date);
      if (existingTask) {
        return existingTask;
      }

      // Create today's tasks if missing
      if (date === today) {
        return await createDailyTasks(date);
      }

      // For past dates, return empty placeholder
      return {
        date,
        fajrStatus: 'none' as PrayerStatus,
        dhuhrStatus: 'none' as PrayerStatus,
        asrStatus: 'none' as PrayerStatus,
        maghribStatus: 'none' as PrayerStatus,
        ishaStatus: 'none' as PrayerStatus,
        totalZikrCount: 0,
        quranMinutes: 0,
        specialTasks: [],
      };
    });

    // Await all promises
    const completeTasks = await Promise.all(tasksPromises);
    return completeTasks;
  } catch (error) {
    console.error(`Error getting recent daily tasks:`, error);
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

    // Check if tasks already exist
    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();

    if (existingTasks.length > 0) {
      const task = existingTasks[0];
      return {
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
      };
    }

    // Create new tasks
    let createdTask: DailyTasksModel;
    await database.write(async () => {
      createdTask = await dailyTasksCollection.create(task => {
        task.date = date;
        task.fajrStatus = DEFAULT_DAILY_TASKS.fajrStatus;
        task.dhuhrStatus = DEFAULT_DAILY_TASKS.dhuhrStatus;
        task.asrStatus = DEFAULT_DAILY_TASKS.asrStatus;
        task.maghribStatus = DEFAULT_DAILY_TASKS.maghribStatus;
        task.ishaStatus = DEFAULT_DAILY_TASKS.ishaStatus;
        task.totalZikrCount = DEFAULT_DAILY_TASKS.totalZikrCount;
        task.quranMinutes = DEFAULT_DAILY_TASKS.quranMinutes;
        task.specialTasks = JSON.stringify(DEFAULT_DAILY_TASKS.specialTasks);
      });
    });

    return {
      date: createdTask!.date,
      fajrStatus: createdTask!.fajrStatus as PrayerStatus,
      dhuhrStatus: createdTask!.dhuhrStatus as PrayerStatus,
      asrStatus: createdTask!.asrStatus as PrayerStatus,
      maghribStatus: createdTask!.maghribStatus as PrayerStatus,
      ishaStatus: createdTask!.ishaStatus as PrayerStatus,
      totalZikrCount: createdTask!.totalZikrCount,
      quranMinutes: createdTask!.quranMinutes || 0,
      specialTasks: JSON.parse(createdTask!.specialTasks),
    };
  } catch (error) {
    console.error('Error creating daily tasks:', error);
    throw error;
  }
};

/**
 * Update prayer status
 */
export const updatePrayerStatus = async (
  date: string,
  prayerName: string,
  status: PrayerStatus,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
    const lcPrayer = prayerName.toLowerCase();

    console.log(`🛠️ PRAYER UPDATE START`);
    console.log(`   Prayer: "${lcPrayer}"`);
    console.log(`   Status: "${status}"`);
    console.log(`   Date: "${date}"`);

    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', date))
      .fetch();
    console.log(`📊 Found ${existingTasks.length} existing tasks for ${date}`);

    let targetTask: DailyTasksModel;

    if (existingTasks.length === 0) {
      console.log(`🏗️ Creating new task for ${date}...`);
      const createdTask = await database.write(async () => {
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
      targetTask = createdTask;
      console.log(`✅ New task created with ID: ${targetTask.id}`);
    } else {
      targetTask = existingTasks[0];
      console.log(`📋 Using existing task with ID: ${targetTask.id}`);
    }

    // Now update the specific prayer status
    await database.write(async () => {
      await targetTask.update(task => {
        console.log(`✏️ Updating ${lcPrayer}Status to "${status}"`);
        switch (lcPrayer) {
          case 'fajr':
            task.fajrStatus = status;
            break;
          case 'dhuhr':
            task.dhuhrStatus = status;
            break;
          case 'asr':
            task.asrStatus = status;
            break;
          case 'maghrib':
            task.maghribStatus = status;
            break;
          case 'isha':
            task.ishaStatus = status;
            break;
          default:
            console.error(`❌ Invalid prayer name: ${lcPrayer}`);
            return;
        }
      });
    });

    // Wait a bit to ensure the database write is fully committed
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify the update
    const verifyTask = await dailyTasksCollection.find(targetTask.id);
    const verifiedStatus = (verifyTask as any)[`${lcPrayer}Status`];

    console.log(
      `🔍 VERIFICATION: ${lcPrayer}Status is now "${verifiedStatus}"`,
    );

    if (verifiedStatus === status) {
      console.log(`✅ SUCCESS: Prayer status update confirmed!`);
    } else {
      console.error(
        `❌ FAILED: Expected "${status}", but got "${verifiedStatus}"`,
      );
      throw new Error(`Database update failed: status mismatch`);
    }

    console.log(`🏁 PRAYER UPDATE COMPLETE`);
  } catch (error) {
    console.error('❌ ERROR in updatePrayerStatus:', error);
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

    if (existingTasks.length === 0) {
      await createDailyTasks(date);
      return updateZikrCount(date, count);
    }

    await database.write(async () => {
      await existingTasks[0].update(task => {
        task.totalZikrCount = count;
      });
    });

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

    if (existingTasks.length === 0) {
      await createDailyTasks(date);
      return updateQuranMinutes(date, minutes);
    }

    await database.write(async () => {
      await existingTasks[0].update(task => {
        task.quranMinutes = minutes;
      });
    });

    console.log(`✅ Updated Quran minutes for ${date}: ${minutes} minutes`);
  } catch (error) {
    console.error('Error updating Quran minutes:', error);
    throw error;
  }
};

/**
 * Check and create today's tasks if they don't exist
 */
export const checkAndCreateTodayTasks = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('date', today))
      .fetch();

    if (existingTasks.length === 0) {
      await createDailyTasks(today);
    }
  } catch (error) {
    console.error("Error checking today's tasks:", error);
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
    const startDateStr = startDate.toISOString().split('T')[0];

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

      monthlyData.push({
        month: monthName,
        year: year,
        prayerCompletionRate:
          totalPrayers > 0 ? (completedPrayers / totalPrayers) * 100 : 0,
        avgQuranMinutes:
          monthTasks.length > 0 ? totalQuranMinutes / monthTasks.length : 0,
        totalDays: monthTasks.length,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly data:', error);
    throw error;
  }
};
