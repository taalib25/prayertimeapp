import {DailyTaskData} from '../../services/db/dailyTaskServices';
import {getSpecialTasksForDate, convertToRegularTasks} from './specialTasks';
import {getTodayDateString} from '../../utils/helpers';

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
}

export const transformDailyData = (
  recentTasks: DailyTaskData[],
): DayTasks[] => {
  const today = getTodayDateString();

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${year}-${month}-${day}`;

    if (dateStr === today) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

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

      // Merge completion status from stored data and calculate completion for Quran/Zikr
      const tasksToShow = specialTasksForDate.map(templateTask => {
        let completed = false;

        // Check stored special task completion
        if (dayData.specialTasks && dayData.specialTasks.length > 0) {
          const storedTask = dayData.specialTasks.find(
            stored => stored.id === templateTask.id,
          );
          completed = storedTask ? storedTask.completed : false;
        }

        // For Quran and Zikr, override completion based on current values
        if (templateTask.category === 'quran') {
          // Completed if current Quran minutes >= task amount
          completed = (dayData.quranMinutes || 0) >= templateTask.amount;
        } else if (templateTask.category === 'zikr') {
          // Completed if current Zikr count >= task amount
          completed = (dayData.totalZikrCount || 0) >= templateTask.amount;
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
      };
    });

  return tasksWithData;
};

export type {DayTasks};
