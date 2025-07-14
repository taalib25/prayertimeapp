import {DailyTaskData} from '../../services/db/dailyTaskServices';
import {getSpecialTasksForDate, convertToRegularTasks} from './specialTasks';
import {getTodayDateString, formatDateString} from '../../utils/helpers';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface DayTasks {
  dateISO: string;
  dayLabel: string;
  tasks: Task[];
  isToday: boolean;
  isEditable?: boolean; // Added for editability control
}

export const transformDailyData = (
  recentTasks: (DailyTaskData & { isEditable?: boolean })[],
): DayTasks[] => {
  const today = getTodayDateString();

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const yesterdayStr = formatDateString(yesterday);
    const dayBeforeYesterdayStr = formatDateString(dayBeforeYesterday);

    if (dateStr === today) {
      return 'Today';
    }
    if (dateStr === yesterdayStr) {
      return 'Yesterday';
    }
    if (dateStr === dayBeforeYesterdayStr) {
      return 'Day Before Yesterday';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }; // Map all recent tasks and use special tasks system
  // Sort chronologically: Day before yesterday → Yesterday → Today (oldest to newest)
  const tasksWithData = recentTasks
    .sort((a, b) => {
      // Sort chronologically (oldest to newest): Day before yesterday → Yesterday → Today
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .map(dayData => {
      // Get special tasks for this date (always the same daily tasks)
      const specialTasksForDate = getSpecialTasksForDate(dayData.date);

      // Merge completion status based on actual data values
      const tasksToShow = specialTasksForDate.map(templateTask => {
        let completed = false;

        // For Quran and Zikr, check completion based on current values
        if (templateTask.category === 'quran') {
          // Completed if current Quran minutes >= task amount
          completed = (dayData.quranMinutes || 0) >= templateTask.amount;
        } else if (templateTask.category === 'zikr') {
          // ✅ FIXED: Robustly determine zikr completion using a greedy approach
          // This correctly handles multiple zikr tasks with different counts
          const zikrTasks = getSpecialTasksForDate(dayData.date)
            .filter(t => t.category === 'zikr')
            .sort((a, b) => b.amount - a.amount); // Sort descending by amount

          let tempCount = dayData.totalZikrCount || 0;
          const completedZikrIds = new Set<string>();

          for (const zikrTask of zikrTasks) {
            if (tempCount >= zikrTask.amount) {
              completedZikrIds.add(zikrTask.id);
              tempCount -= zikrTask.amount;
            }
          }
          completed = completedZikrIds.has(templateTask.id);
        } else if (
          templateTask.category === 'prayer' &&
          templateTask.prayerName
        ) {
          // For prayers, check the prayer status
          const prayerStatus =
            dayData[`${templateTask.prayerName}Status` as keyof DailyTaskData];
          completed = prayerStatus === 'mosque' || prayerStatus === 'home';
        }

        return {
          ...templateTask,
          completed,
        };
      });

      // Convert to regular tasks for display
      const regularTasks = convertToRegularTasks(tasksToShow);

      return {
        dateISO: dayData.date,
        dayLabel: formatDayLabel(dayData.date),
        tasks: regularTasks.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
        })),
        isToday: dayData.date === today,
        isEditable: dayData.isEditable ?? true, // Default to editable if not specified
      };
    });

  return tasksWithData;
};

export type {DayTasks};
