import {useCallback} from 'react';
import {handleTaskCompletion} from './taskHandler';
import {getSpecialTasksForDate, EnhancedSpecialTask} from './specialTasks';
import {useDailyTasks} from '../../hooks/useDailyTasks';

/**
 * Hook to manage task operations with WatermelonDB integration
 * Updated to use enhanced useDailyTasks hook instead of React Context
 */
export const useTaskManager = () => {
  const {refresh} = useDailyTasks();

  /**
   * Handle task toggle with WatermelonDB reactive updates
   */
  const handleTaskToggle = useCallback(
    async (dateISO: string, taskId: string): Promise<void> => {
      try {
        console.log(`🔄 Toggling task ${taskId} for date ${dateISO}`);

        // Get the special tasks template for this date
        const specialTasks = getSpecialTasksForDate(dateISO);
        const taskTemplate = specialTasks.find(task => task.id === taskId);

        if (!taskTemplate) {
          console.error(`❌ Task ${taskId} not found in special tasks`);
          return;
        }

        // Call the toggle handler - it will determine current state and toggle it
        // Using the enhanced hook's refresh method for reactive updates
        await handleTaskCompletion(taskTemplate, dateISO, refresh);

        console.log(`✅ Task ${taskId} toggle operation completed`);
      } catch (error) {
        console.error(`❌ Error toggling task ${taskId}:`, error);
      }
    },
    [refresh],
  );

  /**
   * Get enhanced task details for a specific task ID
   */
  const getTaskDetails = useCallback(
    (dateISO: string, taskId: string): EnhancedSpecialTask | null => {
      const specialTasks = getSpecialTasksForDate(dateISO);
      return specialTasks.find(task => task.id === taskId) || null;
    },
    [],
  );

  /**
   * Get all special tasks for a date
   */
  const getAllTasksForDate = useCallback(
    (dateISO: string): EnhancedSpecialTask[] => {
      return getSpecialTasksForDate(dateISO);
    },
    [],
  );

  return {
    handleTaskToggle,
    getTaskDetails,
    getAllTasksForDate,
  };
};
