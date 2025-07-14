import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors, spacing} from '../../utils/theme';
import {useDailyTasks} from '../../hooks/useDailyTasks';
import {PrayerStatus} from '../../model/DailyTasks';
import DayView from './DayView';
import PaginationDots from './PaginationDots';
import {transformDailyData} from './dataTransform';

// ✅ SIMPLIFIED: Basic selector with native WatermelonDB reactivity
const DailyTasksSelector: React.FC = React.memo(() => {
  // Use reactive WatermelonDB hooks instead of context
  const {
    dailyTasks,
    updatePrayerStatus,
    updateQuranMinutes,
    updateZikrCount,
    getTaskForDate,
  } = useDailyTasks(3); // Get exactly 3 days: day before yesterday, yesterday, today
  // ✅ ENHANCED: Direct task toggle using WatermelonDB observables with automatic sync
  const handleTaskToggle = useCallback(
    async (dateISO: string, taskId: string) => {
      try {
        console.log(`🔄 Toggling task ${taskId} for date ${dateISO}`);

        // Parse the task ID to determine the type
        if (taskId.startsWith('prayer_')) {
          // Handle prayer tasks
          const prayerName = taskId.replace('prayer_', '');
          const currentData = getTaskForDate(dateISO);
          const currentStatus = currentData?.[
            `${prayerName}Status` as keyof typeof currentData
          ] as string;

          // Toggle prayer status: none -> mosque -> none
          const newStatus: PrayerStatus =
            currentStatus === 'mosque' ? 'none' : 'mosque';

          // Update with WatermelonDB - this will automatically trigger reactive updates and sync
          await updatePrayerStatus(dateISO, prayerName, newStatus);
        } else if (taskId.startsWith('quran_')) {
          // Handle Quran tasks - simple toggle between 0 and 15 minutes
          const currentData = getTaskForDate(dateISO);
          const currentMinutes = currentData?.quranMinutes || 0;
          const newMinutes = currentMinutes >= 15 ? 0 : 15;

          // Update with WatermelonDB - this will automatically trigger reactive updates and sync
          await updateQuranMinutes(dateISO, newMinutes);
        } else if (taskId.startsWith('zikr_')) {
          // Handle Zikr tasks - add individual counts
          const currentData = getTaskForDate(dateISO);
          const currentCount = currentData?.totalZikrCount || 0;

          // Add individual task amounts instead of toggling
          let amountToAdd = 100; // Default for istighfar
          if (taskId.includes('allahuakbar')) {
            amountToAdd = 500;
          }

          // Check if this specific amount is already included
          const targetAmount = amountToAdd;
          const hasThisTask = currentCount >= targetAmount;

          const newCount = hasThisTask
            ? currentCount - targetAmount
            : currentCount + targetAmount;

          // Update with WatermelonDB - this will automatically trigger reactive updates and sync
          await updateZikrCount(dateISO, Math.max(0, newCount));
        }

        console.log(`✅ Task ${taskId} toggle completed`);
      } catch (error) {
        console.error('❌ Error in task toggle:', error);
      }
    },
    [updatePrayerStatus, updateQuranMinutes, updateZikrCount, getTaskForDate],
  );

  // ✅ SIMPLE: Basic data transformation without complex caching
  const transformedDailyData = useMemo(() => {
    if (dailyTasks.length === 0) {
      return [];
    }

    console.log('🔄 Computing daily tasks transform...');
    return transformDailyData(dailyTasks);
  }, [dailyTasks]);

  // ✅ SIMPLE: Find today's page with better fallback
  const initialPage = useMemo(() => {
    if (transformedDailyData.length === 0) return 0;

    // Find today's index (should be the last page in chronological order)
    const todayIndex = transformedDailyData.findIndex(
      dayTasks => dayTasks.isToday,
    );

    // If today is found, use it; otherwise use the last page (which should be today)
    const targetPage =
      todayIndex >= 0 ? todayIndex : transformedDailyData.length - 1;

    console.log(
      `📅 Daily tasks: ${transformedDailyData.length} days, today at index ${todayIndex}, showing page ${targetPage}`,
    );
    return targetPage;
  }, [transformedDailyData]);

  const [currentPage, setCurrentPage] = useState(() => {
    // Initialize with 0, will be updated when data loads
    return 0;
  });
  const pagerRef = useRef<PagerView>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ ENHANCED: Ensure today's page is visible with robust initialization
  useEffect(() => {
    if (transformedDailyData.length > 0 && !isInitialized) {
      console.log(
        `📍 Setting up daily tasks view: ${transformedDailyData.length} days, showing page ${initialPage}`,
      );

      setCurrentPage(initialPage);
      setIsInitialized(true);

      // Ensure PagerView shows the correct page with multiple attempts for reliability
      const setTargetPage = () => {
        pagerRef.current?.setPage(initialPage);

        // Double-check after a brief delay to ensure it's set
        setTimeout(() => {
          pagerRef.current?.setPage(initialPage);
        }, 100);
      };

      // Set immediately and also after component is fully mounted
      setTargetPage();
      setTimeout(setTargetPage, 200);
    }
  }, [transformedDailyData, initialPage, isInitialized]);

  // ✅ SIMPLE: Page selection handler with logging
  const handlePageSelected = useCallback((e: any) => {
    const newPage = e.nativeEvent.position;
    console.log(`📄 Daily tasks page selected: ${newPage}`);
    setCurrentPage(newPage);
  }, []);

  // ✅ SIMPLE: Early return for empty data
  if (transformedDailyData.length === 0) {
    return null;
  }

  // Calculate the safe initial page to ensure proper display
  const safeInitialPage = Math.min(
    initialPage,
    transformedDailyData.length - 1,
  );

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={safeInitialPage}
        onPageSelected={handlePageSelected}
        onLayout={() => {
          // Additional safety check - set to target page after layout
          if (isInitialized && transformedDailyData.length > 0) {
            setTimeout(() => {
              pagerRef.current?.setPage(initialPage);
            }, 50);
          }
        }}>
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
