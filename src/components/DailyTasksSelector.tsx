import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {useRecentDailyTasks} from '../hooks/useDailyTasks';

const MOCK_USER_ID = 1001;

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface DayTasks {
  dateISO: string; // YYYY-MM-DD
  dayLabel: string; // "Today", "Yesterday", or formatted date
  tasks: Task[];
}

interface TaskItemProps {
  item: Task;
  onToggleComplete: (taskId: string) => void;
  isToday: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  item,
  onToggleComplete,
  isToday,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.taskItemContainer,
        item.completed && styles.taskItemCompleted,
        !isToday && styles.taskItemDisabled,
      ]}
      onPress={() => isToday && onToggleComplete(item.id)}
      disabled={!isToday}>
      <Text
        style={[
          styles.taskItemText,
          item.completed && styles.taskItemTextCompleted,
          !isToday && styles.taskItemTextDisabled,
        ]}>
        {item.title}
      </Text>
      <View
        style={[
          styles.taskRadioCircle,
          item.completed && styles.taskRadioCircleCompleted,
          !isToday && styles.taskRadioCircleDisabled,
        ]}>
        {item.completed && <View style={styles.taskRadioInnerCircle} />}
      </View>
    </TouchableOpacity>
  );
};

interface DayViewProps {
  dayTasks: DayTasks;
  onTaskToggle: (dateISO: string, taskId: string) => void;
  isToday: boolean;
}

const DayView: React.FC<DayViewProps> = ({dayTasks, onTaskToggle, isToday}) => {
  const shouldScroll = dayTasks.tasks.length > 5;

  return (
    <View style={styles.dayViewContainer}>
      <Text style={[styles.dayLabel, !isToday && styles.dayLabelPast]}>
        {dayTasks.dayLabel}
      </Text>
      <ScrollView
        style={[
          styles.scrollViewStyle,
          !shouldScroll && {maxHeight: undefined},
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.tasksScrollContainer,
          !shouldScroll && {minHeight: undefined},
        ]}
        scrollEnabled={shouldScroll}
        nestedScrollEnabled={shouldScroll}>
        {dayTasks.tasks.map(task => (
          <TaskItem
            key={task.id}
            item={task}
            onToggleComplete={taskId => onTaskToggle(dayTasks.dateISO, taskId)}
            isToday={isToday}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const DailyTasksSelector: React.FC = () => {
  const {recentTasks, isLoading, error, toggleSpecialTaskForDate} =
    useRecentDailyTasks({
      uid: MOCK_USER_ID,
      daysBack: 3,
    });

  const handleTaskToggle = useCallback(
    (dateISO: string, taskId: string) => {
      toggleSpecialTaskForDate(dateISO, taskId);
    },
    [toggleSpecialTaskForDate],
  );
  const transformedDailyData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const formatDayLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (dateStr === today) return 'Today';
      if (dateStr === yesterdayStr) return 'Yesterday';

      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
      };
      return date.toLocaleDateString('en-US', options);
    };

    // Demo dummy tasks - same for all days
    const dummyTasks = [
      {id: 't1', title: '100 x Subhaan Allah', completed: false},
      {
        id: 't2',
        title: '500 x La hawla wala kuwwatha illa billah',
        completed: false,
      },
      {id: 't3', title: '100 x Asthagfirullah', completed: false},
      {id: 't4', title: '15 mins of Quran', completed: false},
      {id: 't5', title: 'ISHA at Masjid', completed: false},
      {id: 't6', title: 'Make Dua for family', completed: false},
      {id: 't7', title: 'Reflect on day', completed: false},
    ];

    // Map all recent tasks and add dummy tasks to days that don't have tasks
    const tasksWithData = recentTasks
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort oldest to newest
      .map(dayData => {
        // Use actual tasks if available, otherwise use dummy tasks for demo
        const tasksToShow =
          dayData.specialTasks.length > 0 ? dayData.specialTasks : dummyTasks;

        return {
          dateISO: dayData.date,
          dayLabel: formatDayLabel(dayData.date),
          tasks: tasksToShow.map(task => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
          })),
          isToday: dayData.date === today,
        };
      });

    return tasksWithData;
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
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={typography.body}>Loading tasks...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={[typography.body, {color: colors.error}]}>{error}</Text>
      </View>
    );
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
              onTaskToggle={handleTaskToggle}
              isToday={dayTasks.isToday}
            />
          </View>
        ))}
      </PagerView>

      {transformedDailyData.length > 1 && (
        <View style={styles.paginationContainer}>
          {transformedDailyData.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive,
              ]}
              onPress={() => pagerRef.current?.setPage(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Theme constants
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const styles = StyleSheet.create({
  container: {
    height: 450, // Increased height for better scrolling
    backgroundColor: '#E1FFD1',
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  dayViewContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  scrollViewStyle: {
    flex: 1,
    maxHeight: 320, // Set max height to ensure scrolling
  },
  tasksScrollContainer: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    minHeight: 340, // Ensure content is taller than container to enable scrolling
  },
  dayLabel: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    marginBottom: spacing.md, // Reduced for more compact layout
    marginLeft: spacing.xs,
    lineHeight: 30, // Reduced line height for more compact text
  },
  dayLabelPast: {
    color: colors.text.prayerBlue,
    opacity: 0.9,
  },
  taskItemContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md, // Reduced for more compact look
    paddingVertical: spacing.md, // Reduced for more compact layout
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm, // Reduced spacing between items
    marginHorizontal: spacing.xs, // Added to prevent cutoff
    shadowColor: colors.text.dark,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08, // Reduced shadow for cleaner look
    shadowRadius: 2,
    elevation: 1,
  },
  taskItemCompleted: {
    backgroundColor: colors.sage,
    borderColor: colors.success,
    borderWidth: 1,
  },
  taskItemDisabled: {},
  taskItemText: {
    ...typography.bodyMedium,
    color: colors.text.blue,
    flex: 1,
    marginRight: spacing.sm, // Reduced margin for more compact layout
    lineHeight: 25, // Reduced line height for more compact text
    fontSize: 14, // Slightly smaller font for more compact layout
  },
  taskItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.forest,
    opacity: 0.8,
  },
  taskItemTextDisabled: {},
  taskRadioCircle: {
    width: 20, // Reduced size for more compact layout
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskRadioCircleCompleted: {
    backgroundColor: colors.primary,
  },
  taskRadioCircleDisabled: {},
  taskRadioInnerCircle: {
    width: 6, // Reduced size proportionally
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs, // Reduced for more compact layout
    // paddingBottom: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted || '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default DailyTasksSelector;
