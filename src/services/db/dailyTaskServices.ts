import {Q} from '@nozbe/watermelondb';
import database from '.';
import DailyTasksModel, {PrayerStatus} from '../../model/DailyTasks';
import {getPrayerTimesForDate, PrayerTimesData} from './PrayerServices';

export interface DailyTaskData {
  uid: number;
  date: string;
  fajrStatus: PrayerStatus;
  dhuhrStatus: PrayerStatus;
  asrStatus: PrayerStatus;
  maghribStatus: PrayerStatus;
  ishaStatus: PrayerStatus;
  tahajjudCompleted: boolean;
  duhaCompleted: boolean;
  totalZikrCount: number;
  quranMinutes: number;
  quranPagesRead: number;
  specialTasks: any[];
}

export interface SpecialTask {
  id: string;
  title: string;
  completed: boolean;
}

const DEFAULT_DAILY_TASKS: Omit<DailyTaskData, 'uid' | 'date'> = {
  fajrStatus: 'pending',
  dhuhrStatus: 'pending',
  asrStatus: 'pending',
  maghribStatus: 'pending',
  ishaStatus: 'pending',
  tahajjudCompleted: false,
  duhaCompleted: false,
  totalZikrCount: 0,
  quranMinutes: 0,
  quranPagesRead: 0,
  specialTasks: [
    {id: 't1', title: 'FAJR at Masjid', completed: false},
    {
      id: 't2',
      title: '500 x La hawla wala kuwwatha illa billah',
      completed: false,
    },
    {id: 't3', title: '100 x Asthagfirullah', completed: false},
    {id: 't4', title: '15 mins of Quran', completed: false},
    {id: 't5', title: 'ISHA at Masjid', completed: false},
    {id: 't6', title: 'Make Dua for family', completed: false},
    {id: 't7', title: 'Reflect on day', completed: false},
  ],
};

/**
 * Get or create daily tasks for a specific date and user
 */
export const getDailyTasksForDate = async (
  uid: number,
  date: string,
): Promise<DailyTaskData | null> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', date))
      .fetch();

    if (existingTasks.length > 0) {
      const task = existingTasks[0];
      return {
        uid: task.uid,
        date: task.date,
        fajrStatus: task.fajrStatus as PrayerStatus,
        dhuhrStatus: task.dhuhrStatus as PrayerStatus,
        asrStatus: task.asrStatus as PrayerStatus,
        maghribStatus: task.maghribStatus as PrayerStatus,
        ishaStatus: task.ishaStatus as PrayerStatus,
        tahajjudCompleted: task.tahajjudCompleted,
        duhaCompleted: task.duhaCompleted,
        totalZikrCount: task.totalZikrCount,
        quranMinutes: task.quranMinutes,
        quranPagesRead: task.quranPagesRead,
        specialTasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
      };
    }

    // Create new daily tasks with default values
    return createDailyTasks(uid, date);
  } catch (error) {
    console.error(`Error getting daily tasks for ${date}:`, error);
    throw error;
  }
};

/**
 * Create daily tasks for a specific date
 */
export const createDailyTasks = async (
  uid: number,
  date: string,
): Promise<DailyTaskData> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    let createdTask: DailyTasksModel;

    await database.write(async () => {
      createdTask = await dailyTasksCollection.create(task => {
        task.uid = uid;
        task.date = date;
        task.fajrStatus = DEFAULT_DAILY_TASKS.fajrStatus;
        task.dhuhrStatus = DEFAULT_DAILY_TASKS.dhuhrStatus;
        task.asrStatus = DEFAULT_DAILY_TASKS.asrStatus;
        task.maghribStatus = DEFAULT_DAILY_TASKS.maghribStatus;
        task.ishaStatus = DEFAULT_DAILY_TASKS.ishaStatus;
        task.tahajjudCompleted = DEFAULT_DAILY_TASKS.tahajjudCompleted;
        task.duhaCompleted = DEFAULT_DAILY_TASKS.duhaCompleted;
        task.totalZikrCount = DEFAULT_DAILY_TASKS.totalZikrCount;
        task.quranMinutes = DEFAULT_DAILY_TASKS.quranMinutes;
        task.quranPagesRead = DEFAULT_DAILY_TASKS.quranPagesRead;
        task.specialTasks = JSON.stringify(DEFAULT_DAILY_TASKS.specialTasks);
      });
    });

    console.log(`✅ Created daily tasks for ${date}`);

    return {
      uid: createdTask!.uid,
      date: createdTask!.date,
      fajrStatus: createdTask!.fajrStatus as PrayerStatus,
      dhuhrStatus: createdTask!.dhuhrStatus as PrayerStatus,
      asrStatus: createdTask!.asrStatus as PrayerStatus,
      maghribStatus: createdTask!.maghribStatus as PrayerStatus,
      ishaStatus: createdTask!.ishaStatus as PrayerStatus,
      tahajjudCompleted: createdTask!.tahajjudCompleted,
      duhaCompleted: createdTask!.duhaCompleted,
      totalZikrCount: createdTask!.totalZikrCount,
      quranMinutes: createdTask!.quranMinutes,
      quranPagesRead: createdTask!.quranPagesRead,
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
  uid: number,
  date: string,
  prayerName: string,
  status: PrayerStatus,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', date))
      .fetch();

    if (existingTasks.length === 0) {
      // Create new task first
      await createDailyTasks(uid, date);
      return updatePrayerStatus(uid, date, prayerName, status);
    }

    await database.write(async () => {
      await existingTasks[0].update(task => {
        switch (prayerName.toLowerCase()) {
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
        }
      });
    });

    console.log(`✅ Updated ${prayerName} status to ${status} for ${date}`);
  } catch (error) {
    console.error('Error updating prayer status:', error);
    throw error;
  }
};

/**
 * Update special task status
 */
export const updateSpecialTaskStatus = async (
  uid: number,
  date: string,
  taskId: string,
  completed: boolean,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', date))
      .fetch();

    if (existingTasks.length === 0) {
      await createDailyTasks(uid, date);
      return updateSpecialTaskStatus(uid, date, taskId, completed);
    }

    await database.write(async () => {
      await existingTasks[0].update(task => {
        const specialTasks = task.specialTasks
          ? JSON.parse(task.specialTasks)
          : [];
        const updatedTasks = specialTasks.map((t: SpecialTask) =>
          t.id === taskId ? {...t, completed} : t,
        );
        task.specialTasks = JSON.stringify(updatedTasks);
      });
    });

    console.log(
      `✅ Updated task ${taskId} to ${completed ? 'completed' : 'pending'}`,
    );
  } catch (error) {
    console.error('Error updating special task:', error);
    throw error;
  }
};

/**
 * Update zikr count
 */
export const updateZikrCount = async (
  uid: number,
  date: string,
  count: number,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const existingTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', date))
      .fetch();

    if (existingTasks.length === 0) {
      await createDailyTasks(uid, date);
      return updateZikrCount(uid, date, count);
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
 * Reset daily tasks to default values (called at start of each day)
 */
export const resetDailyTasks = async (
  uid: number,
  date: string,
): Promise<void> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    // Check if tasks already exist for this date
    const existingTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', date))
      .fetch();

    if (existingTasks.length > 0) {
      // Update existing to default values
      await database.write(async () => {
        await existingTasks[0].update(task => {
          task.fajrStatus = DEFAULT_DAILY_TASKS.fajrStatus;
          task.dhuhrStatus = DEFAULT_DAILY_TASKS.dhuhrStatus;
          task.asrStatus = DEFAULT_DAILY_TASKS.asrStatus;
          task.maghribStatus = DEFAULT_DAILY_TASKS.maghribStatus;
          task.ishaStatus = DEFAULT_DAILY_TASKS.ishaStatus;
          task.tahajjudCompleted = DEFAULT_DAILY_TASKS.tahajjudCompleted;
          task.duhaCompleted = DEFAULT_DAILY_TASKS.duhaCompleted;
          task.totalZikrCount = DEFAULT_DAILY_TASKS.totalZikrCount;
          task.quranMinutes = DEFAULT_DAILY_TASKS.quranMinutes;
          task.quranPagesRead = DEFAULT_DAILY_TASKS.quranPagesRead;
          task.specialTasks = JSON.stringify(DEFAULT_DAILY_TASKS.specialTasks);
        });
      });
    } else {
      // Create new with default values
      await createDailyTasks(uid, date);
    }

    console.log(`✅ Reset daily tasks for ${date}`);
  } catch (error) {
    console.error('Error resetting daily tasks:', error);
    throw error;
  }
};

/**
 * Enhanced auto-reset that works in background
 */
export const checkAndCreateTodayTasks = async (uid: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if today's tasks already exist
    const existingTasks = await getDailyTasksForDate(uid, today);

    if (!existingTasks) {
      // Only create tasks for today if they don't exist
      await createDailyTasks(uid, today);
      console.log(`✅ Created daily tasks for today: ${today}`);
    } else {
      console.log(`✅ Daily tasks already exist for today: ${today}`);
    }
  } catch (error) {
    console.error('Error in checkAndCreateTodayTasks:', error);
    throw error;
  }
};

/**
 * Observable daily tasks for reactive UI
 */
export const observeDailyTasksForDate = (uid: number, date: string) => {
  const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');
  return dailyTasksCollection
    .query(Q.where('uid', uid), Q.where('date', date))
    .observe();
};

export const getDailyTasksForDateRange = async (
  uid: number,
  startDate: string,
  endDate: string,
): Promise<DailyTaskData[]> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    const tasks = await dailyTasksCollection
      .query(
        Q.where('uid', uid),
        Q.where('date', Q.gte(startDate)),
        Q.where('date', Q.lte(endDate)),
        Q.sortBy('date', Q.asc),
      )
      .fetch();

    return tasks.map(task => ({
      uid: task.uid,
      date: task.date,
      fajrStatus: task.fajrStatus as PrayerStatus,
      dhuhrStatus: task.dhuhrStatus as PrayerStatus,
      asrStatus: task.asrStatus as PrayerStatus,
      maghribStatus: task.maghribStatus as PrayerStatus,
      ishaStatus: task.ishaStatus as PrayerStatus,
      tahajjudCompleted: task.tahajjudCompleted,
      duhaCompleted: task.duhaCompleted,
      totalZikrCount: task.totalZikrCount,
      quranMinutes: task.quranMinutes,
      quranPagesRead: task.quranPagesRead,
      specialTasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
    }));
  } catch (error) {
    console.error(
      `Error getting daily tasks for ${startDate} to ${endDate}:`,
      error,
    );
    throw error;
  }
};

/**
 * Get recent daily tasks for a user (last N days)
 * This is more efficient than fetching individual days
 */
export const getRecentDailyTasks = async (
  uid: number,
  daysBack: number = 3,
): Promise<DailyTaskData[]> => {
  try {
    const dailyTasksCollection = database.get<DailyTasksModel>('daily_tasks');

    // Calculate the date range
    const endDate = new Date().toISOString().split('T')[0]; // Today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysBack - 1));
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query for the date range, ordered by date descending (most recent first)
    const tasks = await dailyTasksCollection
      .query(
        Q.where('uid', uid),
        Q.where('date', Q.gte(startDateStr)),
        Q.where('date', Q.lte(endDate)),
        Q.sortBy('date', Q.desc),
      )
      .fetch();

    // Transform to DailyTaskData format
    const transformedTasks = tasks.map(task => ({
      uid: task.uid,
      date: task.date,
      fajrStatus: task.fajrStatus as PrayerStatus,
      dhuhrStatus: task.dhuhrStatus as PrayerStatus,
      asrStatus: task.asrStatus as PrayerStatus,
      maghribStatus: task.maghribStatus as PrayerStatus,
      ishaStatus: task.ishaStatus as PrayerStatus,
      tahajjudCompleted: task.tahajjudCompleted,
      duhaCompleted: task.duhaCompleted,
      totalZikrCount: task.totalZikrCount,
      quranMinutes: task.quranMinutes,
      quranPagesRead: task.quranPagesRead,
      specialTasks: task.specialTasks ? JSON.parse(task.specialTasks) : [],
    }));

    // Fill in missing dates with default tasks if needed
    const allDates = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.push(date.toISOString().split('T')[0]);
    }

    const completeTasks = allDates.map(date => {
      const existingTask = transformedTasks.find(task => task.date === date);
      if (existingTask) {
        return existingTask;
      }

      // Return default task structure for missing dates
      return {
        uid,
        date,
        fajrStatus: 'pending' as PrayerStatus,
        dhuhrStatus: 'pending' as PrayerStatus,
        asrStatus: 'pending' as PrayerStatus,
        maghribStatus: 'pending' as PrayerStatus,
        ishaStatus: 'pending' as PrayerStatus,
        tahajjudCompleted: false,
        duhaCompleted: false,
        totalZikrCount: 0,
        quranMinutes: 0,
        quranPagesRead: 0,
        specialTasks: [],
      };
    });

    return completeTasks;
  } catch (error) {
    console.error(`Error getting recent daily tasks:`, error);
    throw error;
  }
};
