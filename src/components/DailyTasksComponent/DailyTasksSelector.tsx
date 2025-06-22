import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors, spacing} from '../../utils/theme';
import {useDailyTasksContext} from '../../contexts/DailyTasksContext';
import DayView from './DayView';
import PaginationDots from './PaginationDots';
import {LoadingState, ErrorState} from './LoadingState';
import {transformDailyData} from './dataTransform';
import {useTaskManager} from './useTaskManager';
import {dataCache} from '../../utils/dataCache';

// 🚀 PERFORMANCE: Memoized selector to prevent unnecessary re-renders
const DailyTasksSelector: React.FC = React.memo(() => {
  // Use the centralized context instead of individual hook
  const {dailyTasks, isLoading, error} = useDailyTasksContext();

  // Use the task manager for handling database operations
  const {handleTaskToggle} = useTaskManager();

  // 🚀 PERFORMANCE: Stable callback using useCallback with minimal dependencies
  const handleTaskToggleSimple = useCallback(
    async (dateISO: string, taskId: string) => {
      try {
        await handleTaskToggle(dateISO, taskId);
        // Context will automatically refresh all UIs
      } catch (error) {
        console.error('❌ Error in task toggle:', error);
      }
    },
    [handleTaskToggle],
  );

  // 🚀 PERFORMANCE: Enhanced caching with content hash for better cache hits
  const transformedDailyData = useMemo(() => {
    // Early return for empty data
    if (dailyTasks.length === 0) {
      return [];
    }
    
    // Create a more stable cache key based on data length and key dates
    const todayTask = dailyTasks.find(t => t.date === new Date().toISOString().split('T')[0]);
    const cacheKey = `daily-transform-v3-${dailyTasks.length}-${todayTask?.date || 'none'}-${todayTask?.totalZikrCount || 0}`;
      
    // Check cache first
    let cachedData = dataCache.get<any[]>(cacheKey);
    if (cachedData) {
      console.log('⚡ DailyTasksSelector: Using cached transform');
      return cachedData;
    }
    
    console.log('🔄 Computing daily tasks transform...');
    const result = transformDailyData(dailyTasks);
    
    // Cache for 3 minutes with better invalidation
    dataCache.set(cacheKey, result, 180000);
    return result;
  }, [dailyTasks]);

  // 🚀 PERFORMANCE: Stable initial page calculation
  const initialPageData = useMemo(() => {
    if (transformedDailyData.length === 0) {
      return { todayIndex: -1, initialPage: 0 };
    }
    
    const todayIndex = transformedDailyData.findIndex(dayTasks => dayTasks.isToday);
    return {
      todayIndex,
      initialPage: todayIndex >= 0 ? todayIndex : Math.max(0, transformedDailyData.length - 1)
    };
  }, [transformedDailyData]);

  const [currentPage, setCurrentPage] = useState(initialPageData.initialPage);
  const pagerRef = useRef<PagerView>(null);

  // 🚀 PERFORMANCE: Optimized page selection handler
  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  // 🚀 PERFORMANCE: Debounced page update to prevent excessive re-renders
  useEffect(() => {
    if (initialPageData.todayIndex >= 0 && initialPageData.todayIndex !== currentPage) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(initialPageData.todayIndex);
      }, 100); // Small delay to batch updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [initialPageData.todayIndex, currentPage]);

  // 🚀 PERFORMANCE: Early returns for better performance
  if (isLoading && transformedDailyData.length === 0) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (transformedDailyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={initialPageData.initialPage}
        onPageSelected={handlePageSelected}
        removeClippedSubviews={true} // 🚀 PERFORMANCE: Remove off-screen views
        pageMargin={4} // Small margin for better performance
        overdrag={false} // 🚀 PERFORMANCE: Disable overdrag for better performance
      >
        {transformedDailyData.map((dayTasks, index) => (
          <View key={dayTasks.dateISO} style={styles.pageContainer}>
            <DayView
              dayTasks={dayTasks}
              onTaskToggle={handleTaskToggleSimple}
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
});

// Display name for debugging
DailyTasksSelector.displayName = 'DailyTasksSelector';

const styles = StyleSheet.create({
  container: {
    height: 450,
    backgroundColor: '#E1FFD1',
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
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
