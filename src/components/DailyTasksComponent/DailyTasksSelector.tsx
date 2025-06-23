import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors, spacing} from '../../utils/theme';
import {useDailyTasksContext} from '../../contexts/DailyTasksContext';
import {PrayerStatus} from '../../model/DailyTasks';
import DayView from './DayView';
import PaginationDots from './PaginationDots';
import {LoadingState, ErrorState} from './LoadingState';
import {transformDailyData} from './dataTransform';

// ✅ SIMPLIFIED: Basic selector without complex caching
const DailyTasksSelector: React.FC = React.memo(() => {
  // Use the centralized context
  const {
    dailyTasks,
    isLoading,
    error,
    updatePrayerAndRefresh,
    updateQuranAndRefresh,
    updateZikrAndRefresh,
  } = useDailyTasksContext();
  // ✅ SIMPLE: Direct task toggle using context methods
  const handleTaskToggle = useCallback(
    async (dateISO: string, taskId: string) => {
      try {
        console.log(`🔄 Toggling task ${taskId} for date ${dateISO}`);

        // Parse the task ID to determine the type
        if (taskId.startsWith('prayer_')) {
          // Handle prayer tasks
          const prayerName = taskId.replace('prayer_', '');
          const currentData = dailyTasks.find(task => task.date === dateISO);
          const currentStatus = currentData?.[
            `${prayerName}Status` as keyof typeof currentData
          ] as string;
          // Toggle prayer status: none -> mosque -> none
          const newStatus: PrayerStatus =
            currentStatus === 'mosque' ? 'none' : 'mosque';
          await updatePrayerAndRefresh(dateISO, prayerName, newStatus);
        } else if (taskId.startsWith('quran_')) {
          // Handle Quran tasks - toggle 15 minutes
          const currentData = dailyTasks.find(task => task.date === dateISO);
          const currentMinutes = currentData?.quranMinutes || 0;
          const newMinutes = currentMinutes >= 15 ? 0 : 15; // Toggle 15 minutes
          await updateQuranAndRefresh(dateISO, newMinutes);
        } else if (taskId.startsWith('zikr_')) {
          // Handle Zikr tasks - toggle 100 count
          const currentData = dailyTasks.find(task => task.date === dateISO);
          const currentCount = currentData?.totalZikrCount || 0;
          const newCount = currentCount >= 100 ? 0 : 100; // Toggle 100 count
          await updateZikrAndRefresh(dateISO, newCount);
        }

        console.log(`✅ Task ${taskId} toggle completed`);
      } catch (error) {
        console.error('❌ Error in task toggle:', error);
      }
    },
    [
      dailyTasks,
      updatePrayerAndRefresh,
      updateQuranAndRefresh,
      updateZikrAndRefresh,
    ],
  );

  // ✅ SIMPLE: Basic data transformation without complex caching
  const transformedDailyData = useMemo(() => {
    if (dailyTasks.length === 0) {
      return [];
    }

    console.log('🔄 Computing daily tasks transform...');
    return transformDailyData(dailyTasks);
  }, [dailyTasks]);

  // ✅ SIMPLE: Find today's page
  const initialPage = useMemo(() => {
    if (transformedDailyData.length === 0) return 0;

    const todayIndex = transformedDailyData.findIndex(
      dayTasks => dayTasks.isToday,
    );
    return todayIndex >= 0 ? todayIndex : 0;
  }, [transformedDailyData]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);

  // ✅ SYNC: Update currentPage when initialPage changes (when data loads)
  useEffect(() => {
    if (initialPage !== currentPage) {
      console.log(`📍 Syncing page: ${currentPage} → ${initialPage} (Today)`);
      setCurrentPage(initialPage);
      // Also programmatically scroll the PagerView to Today
      if (pagerRef.current && initialPage > 0) {
        pagerRef.current.setPage(initialPage);
      }
    }
  }, []);

  // ✅ SIMPLE: Page selection handler
  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  // ✅ SIMPLE: Early returns for loading states
  if (isLoading) {
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
        initialPage={initialPage}
        onPageSelected={handlePageSelected}>
        {transformedDailyData.map((dayTasks, index) => (
          <View key={dayTasks.dateISO} style={styles.pageContainer}>
            <DayView
              dayTasks={dayTasks}
              onTaskToggle={handleTaskToggle}
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
