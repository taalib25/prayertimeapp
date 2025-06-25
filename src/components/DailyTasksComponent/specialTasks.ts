import {SpecialTask} from '../../services/db/dailyTaskServices';

// Task categories that map to database functions
export type TaskCategory = 'prayer' | 'quran' | 'zikr';

// Task units for different categories
export type TaskUnit = 'status' | 'minutes' | 'count';

// Enhanced special task interface
export interface EnhancedSpecialTask extends SpecialTask {
  category: TaskCategory;
  unit: TaskUnit;
  amount: number;
  prayerName?: string; // For prayer tasks
}

// Daily special tasks - same for every day
export const DAILY_SPECIAL_TASKS: EnhancedSpecialTask[] = [
  // 5 Daily Prayers
  // Quran recitation
  {
    id: 'quran_15min',
    title: '15 mins of Quran',
    completed: false,
    category: 'quran',
    unit: 'minutes',
    amount: 15,
  },
  // Zikr tasks
  {
    id: 'zikr_allahuakbar',
    title: '100x La hawla wala kuwwatha illa billah',
    completed: false,
    category: 'zikr',
    unit: 'count',
    amount: 100,
  },
  {
    id: 'prayer_fajr',
    title: 'Fajr at Masjid',
    completed: false,
    category: 'prayer',
    unit: 'status',
    amount: 1,
    prayerName: 'fajr',
  },
  {
    id: 'prayer_dhuhr',
    title: 'Dhuhr at Masjid',
    completed: false,
    category: 'prayer',
    unit: 'status',
    amount: 1,
    prayerName: 'dhuhr',
  },
  {
    id: 'prayer_asr',
    title: 'Asr at Masjid',
    completed: false,
    category: 'prayer',
    unit: 'status',
    amount: 1,
    prayerName: 'asr',
  },
  {
    id: 'prayer_maghrib',
    title: 'Maghrib at Masjid',
    completed: false,
    category: 'prayer',
    unit: 'status',
    amount: 1,
    prayerName: 'maghrib',
  },
  {
    id: 'prayer_isha',
    title: 'Isha at Masjid',
    completed: false,
    category: 'prayer',
    unit: 'status',
    amount: 1,
    prayerName: 'isha',
  },

];

/**
 * Get special tasks for a specific date
 * For now, returns the same tasks every day
 */
export const getSpecialTasksForDate = (date: string): EnhancedSpecialTask[] => {
  // Reset all tasks to uncompleted for the new day
  return DAILY_SPECIAL_TASKS.map(task => ({
    ...task,
    completed: false,
  }));
};

/**
 * Convert enhanced special tasks back to regular special tasks for storage
 */
export const convertToRegularTasks = (
  enhancedTasks: EnhancedSpecialTask[],
): SpecialTask[] => {
  return enhancedTasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
  }));
};

export type {EnhancedSpecialTask as SpecialTaskWithMeta};
