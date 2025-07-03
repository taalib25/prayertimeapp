import {useState, useEffect, useCallback} from 'react';
import {
  getRecentDailyTasks,
  DailyTaskData,
  getRecentMonthsData,
} from '../services/db/dailyTaskServices';

interface UseRecentDailyTasksProps {
  daysBack?: number;
}

export const useRecentDailyTasks = ({
  daysBack = 3,
}: UseRecentDailyTasksProps = {}) => {
  const [recentTasks, setRecentTasks] = useState<DailyTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchRecentTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch recent tasks (getRecentDailyTasks will handle creating today's task if needed)
      const tasks = await getRecentDailyTasks(daysBack);
      setRecentTasks(tasks);
    } catch (err) {
      setError('Failed to fetch recent daily tasks');
      console.error('❌ Hook: Error fetching recent daily tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [daysBack]); // Initial load
  useEffect(() => {
    fetchRecentTasks();
  }, [fetchRecentTasks]);

  return {
    recentTasks,
    isLoading,
    error,
    refetch: fetchRecentTasks,
  };
};

/**
 */
export const useMonthlyData = ({
  uid,
  monthsBack = 3,
}: {
  uid: number;
  monthsBack?: number;
}) => {
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
