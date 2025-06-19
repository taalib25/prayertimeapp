import {useCallback} from 'react';
import {handleTaskCompletion} from './taskHandler';
import {getSpecialTasksForDate, EnhancedSpecialTask} from './specialTasks';
import {useDailyTasksContext} from '../../contexts/DailyTasksContext';

/**
 * Hook to manage task operations with database integration
 */
export const useTaskManager = () => {
  const {refreshData} = useDailyTasksContext();

  /**
   * Handle task toggle with database update
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
        } // Call the toggle handler - it will determine current state and toggle it
        await handleTaskCompletion(taskTemplate, dateISO, refreshData);

        console.log(`✅ Task ${taskId} toggle operation completed`);
      } catch (error) {
        console.error(`❌ Error toggling task ${taskId}:`, error);
        throw error;
      }
    },
    [],
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
