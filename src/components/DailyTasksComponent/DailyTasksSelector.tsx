import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import database from '../../services/db';
import DailyTasksModel, {PrayerStatus} from '../../model/DailyTasks';
import {colors, spacing} from '../../utils/theme';
import {formatDateString, getTodayDateString} from '../../utils/helpers';
import DayView from './DayView';
import PaginationDots from './PaginationDots';
import {transformDailyData} from './dataTransform';
import {
  updatePrayerStatus,
  updateQuranMinutes,
  updateZikrCount,
} from '../../services/db/dailyTaskServices';
import {DAILY_SPECIAL_TASKS} from './specialTasks';

// ✅ PROPER REACTIVE: Component using withObservables HOC pattern
interface DailyTasksSelectorProps {
  dailyTasks: DailyTasksModel[];
}

const DailyTasksSelector: React.FC<DailyTasksSelectorProps> = React.memo(
  ({dailyTasks}) => {
    // ✅ REACTIVE: Debug effect to track ALL reactive changes
    useEffect(() => {
      console.log(
        `🔥 DailyTasksSelector: REACTIVE UPDATE! dailyTasks count: ${dailyTasks.length}`,
      );
      console.log(
        `📊 DailyTasksSelector: All dates: ${dailyTasks
          .map(t => t.date)
          .join(', ')}`,
      );
      if (dailyTasks.length > 0) {
        console.log(`🔍 DailyTasksSelector: First task details:`, {
          date: dailyTasks[0].date,
          fajr: dailyTasks[0].fajrStatus,
          dhuhr: dailyTasks[0].dhuhrStatus,
          zikr: dailyTasks[0].totalZikrCount,
          quran: dailyTasks[0].quranMinutes,
        });
      }
    }, [dailyTasks]);
    // ✅ ENHANCED: Direct task toggle using WatermelonDB with automatic reactive updates
    const handleTaskToggle = useCallback(
      async (dateISO: string, taskId: string) => {
        try {
          console.log(`🔄 Toggling task ${taskId} for date ${dateISO}`);

          // Parse the task ID to determine the type
          if (taskId.startsWith('prayer_')) {
            // Handle prayer tasks
            const prayerName = taskId.replace('prayer_', '');

            // Find current task to get current status
            const currentTask = dailyTasks.find(task => task.date === dateISO);
            const currentStatus = currentTask?.[
              `${prayerName}Status` as keyof DailyTasksModel
            ] as string;

            // Toggle prayer status: none -> mosque -> none
            const newStatus: PrayerStatus =
              currentStatus === 'mosque' ? 'none' : 'mosque';

            // Update with WatermelonDB - this will automatically trigger reactive updates
            await updatePrayerStatus(dateISO, prayerName, newStatus);
          } else if (taskId.startsWith('quran_')) {
            // Handle Quran tasks - simple toggle between 0 and 15 minutes
            const currentTask = dailyTasks.find(task => task.date === dateISO);
            const currentMinutes = currentTask?.quranMinutes || 0;
            const newMinutes = currentMinutes >= 15 ? 0 : 15;

            // Update with WatermelonDB - this will automatically trigger reactive updates
            await updateQuranMinutes(dateISO, newMinutes);
          } else if (taskId.startsWith('zikr_')) {
            // ✅ FIXED: Robust zikr toggle logic
            const currentTask = dailyTasks.find(task => task.date === dateISO);
            const currentCount = currentTask?.totalZikrCount || 0;

            // Get the specific task details from our static list
            const zikrTaskDetails = DAILY_SPECIAL_TASKS.find(
              t => t.id === taskId,
            );
            if (!zikrTaskDetails) {
              console.error(`❌ Zikr task with ID ${taskId} not found`);
              return;
            }
            const taskAmount = zikrTaskDetails.amount;

            // Determine if the task is currently completed using the same greedy logic as dataTransform
            const zikrTasks = DAILY_SPECIAL_TASKS.filter(
              t => t.category === 'zikr',
            ).sort((a, b) => b.amount - a.amount);

            let tempCount = currentCount;
            const completedZikrIds = new Set<string>();
            for (const zikr of zikrTasks) {
              if (tempCount >= zikr.amount) {
                completedZikrIds.add(zikr.id);
                tempCount -= zikr.amount;
              }
            }
            const isCurrentlyCompleted = completedZikrIds.has(taskId);

            console.log(
              `🔧 Zikr task ${taskId}: current=${currentCount}, required=${taskAmount}, completed=${isCurrentlyCompleted}`,
            );

            // Toggle the count based on completion status
            const newCount = isCurrentlyCompleted
              ? currentCount - taskAmount // Subtract if completed
              : currentCount + taskAmount; // Add if not completed

            await updateZikrCount(dateISO, Math.max(0, newCount));
          }

          console.log(`✅ Task ${taskId} toggle completed`);
        } catch (error) {
          console.error('❌ Error in task toggle:', error);
        }
      },
      [dailyTasks], // Now depends on reactive dailyTasks prop from withObservables
    );

    // ✅ REACTIVE: Enhanced data transformation - creates 3 days regardless of database content
    const transformedDailyData = useMemo(() => {
      console.log('🔄 Computing daily tasks transform from reactive prop...');

      // Generate the 3 required dates: day before yesterday, yesterday, today
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dayBeforeYesterday = new Date(today);
      dayBeforeYesterday.setDate(today.getDate() - 2);

      const requiredDates = [
        formatDateString(dayBeforeYesterday),
        formatDateString(yesterday),
        formatDateString(today),
      ];

      // Create data for all 3 days, using database data if available or defaults if not
      const dailyTasksData = requiredDates.map(date => {
        const existingTask = dailyTasks.find(task => task.date === date);

        if (existingTask) {
          // Use existing data from database
          return {
            date: existingTask.date,
            fajrStatus: existingTask.fajrStatus as PrayerStatus,
            dhuhrStatus: existingTask.dhuhrStatus as PrayerStatus,
            asrStatus: existingTask.asrStatus as PrayerStatus,
            maghribStatus: existingTask.maghribStatus as PrayerStatus,
            ishaStatus: existingTask.ishaStatus as PrayerStatus,
            totalZikrCount: existingTask.totalZikrCount,
            quranMinutes: existingTask.quranMinutes,
            specialTasks: existingTask.specialTasks
              ? JSON.parse(existingTask.specialTasks)
              : [],
          };
        } else {
          // Create default empty data for missing dates
          return {
            date,
            fajrStatus: 'none' as PrayerStatus,
            dhuhrStatus: 'none' as PrayerStatus,
            asrStatus: 'none' as PrayerStatus,
            maghribStatus: 'none' as PrayerStatus,
            ishaStatus: 'none' as PrayerStatus,
            totalZikrCount: 0,
            quranMinutes: 0,
            specialTasks: [],
          };
        }
      });

      console.log(
        `📅 Generated data for ${
          dailyTasksData.length
        } days (${requiredDates.join(', ')})`,
      );
      return transformDailyData(dailyTasksData);
    }, [dailyTasks]); // Now reactive to withObservables prop

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
  },
);

// ✅ BRUTE FORCE: Maximum reactive configuration - observe ALL database changes
const enhance = withObservables([], () => ({
  dailyTasks: database
    .get<DailyTasksModel>('daily_tasks')
    .query(Q.sortBy('date', Q.desc))
    .observeWithColumns([
      'date',
      'fajr_status',
      'dhuhr_status',
      'asr_status',
      'maghrib_status',
      'isha_status',
      'total_zikr_count',
      'quran_minutes',
      'special_tasks',
    ]),
}));
export default enhance(DailyTasksSelector);

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
    paddingHorizontal: spacing.md,
  },
});
