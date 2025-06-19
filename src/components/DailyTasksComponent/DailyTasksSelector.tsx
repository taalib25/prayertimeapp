import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors, spacing} from '../../utils/theme';
import {useRecentDailyTasks} from '../../hooks/useDailyTasks';
import DayView from './DayView';
import PaginationDots from './PaginationDots';
import {LoadingState, ErrorState} from './LoadingState';
import {transformDailyData} from './dataTransform';
import {useTaskManager} from './useTaskManager';

const DailyTasksSelector: React.FC = () => {
  const {recentTasks, isLoading, error, refetch} = useRecentDailyTasks({
    daysBack: 3,
  });

  // Use the task manager for handling database operations
  const {handleTaskToggle} = useTaskManager();

  // Wrap the handleTaskToggle to refresh data after update
  const handleTaskToggleWithRefresh = useCallback(
    async (dateISO: string, taskId: string) => {
      try {
        await handleTaskToggle(dateISO, taskId);
        // Refresh the data to show the updated state
        await refetch();
      } catch (error) {
        console.error('❌ Error in task toggle:', error);
      }
    },
    [handleTaskToggle, refetch],
  );

  const transformedDailyData = useMemo(() => {
    return transformDailyData(recentTasks);
  }, [recentTasks]);

  // Find today's index for initial page
  const todayIndex = transformedDailyData.findIndex(
    dayTasks => dayTasks.isToday,
  );
  const initialPage =
    todayIndex >= 0 ? todayIndex : transformedDailyData.length - 1;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  // Update current page when data changes
  useEffect(() => {
    const newTodayIndex = transformedDailyData.findIndex(
      dayTasks => dayTasks.isToday,
    );
    if (newTodayIndex >= 0 && newTodayIndex !== currentPage) {
      setCurrentPage(newTodayIndex);
    }
  }, [transformedDailyData]);
  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Hide component if no tasks found
  if (transformedDailyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={initialPage}
        onPageSelected={handlePageSelected}>
        {transformedDailyData.map((dayTasks, index) => (
          <View key={dayTasks.dateISO} style={styles.pageContainer}>
            <DayView
              dayTasks={dayTasks}
              onTaskToggle={handleTaskToggleWithRefresh}
              isToday={dayTasks.isToday}
            />
          </View>
        ))}
      </PagerView>

      <PaginationDots
        totalPages={transformedDailyData.length}
        currentPage={currentPage}
        pagerRef={pagerRef}
      />
    </View>
  );
};

// Theme constants

const styles = StyleSheet.create({
  container: {
    height: 450,
    backgroundColor: '#E1FFD1',
    borderRadius: 20,

    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});

export default DailyTasksSelector;
