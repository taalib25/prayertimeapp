import React, {useState, useRef, useCallback, useMemo} from 'react';
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
}

const TaskItem: React.FC<TaskItemProps> = ({item, onToggleComplete}) => {
  return (
    <TouchableOpacity
      style={[
        styles.taskItemContainer,
        item.completed && styles.taskItemCompleted,
      ]}
      onPress={() => onToggleComplete(item.id)}>
      <Text
        style={[
          styles.taskItemText,
          item.completed && styles.taskItemTextCompleted,
        ]}>
        {item.title}
      </Text>
      <View
        style={[
          styles.taskRadioCircle,
          item.completed && styles.taskRadioCircleCompleted,
        ]}>
        {item.completed && <View style={styles.taskRadioInnerCircle} />}
      </View>
    </TouchableOpacity>
  );
};

interface DayViewProps {
  dayTasks: DayTasks;
  onTaskToggle: (dateISO: string, taskId: string) => void;
}

const DayView: React.FC<DayViewProps> = ({dayTasks, onTaskToggle}) => {
  const shouldScroll = dayTasks.tasks.length > 5;

  return (
    <View style={styles.dayViewContainer}>
      <Text style={styles.dayLabel}>{dayTasks.dayLabel}</Text>
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
          />
        ))}
      </ScrollView>
    </View>
  );
};

const DailyTasksSelector: React.FC = () => {
  // Use the new efficient hook to get recent tasks
  const {recentTasks, isLoading, error, toggleSpecialTaskForDate} =
    useRecentDailyTasks({
      uid: MOCK_USER_ID,
      daysBack: 3,
    });

  console.log('Recent tasks >>>>>>>>>>>>', recentTasks);

  const handleTaskToggle = useCallback(
    (dateISO: string, taskId: string) => {
      toggleSpecialTaskForDate(dateISO, taskId);
    },
    [toggleSpecialTaskForDate],
  );

  const transformedDailyData = useMemo(() => {
    const formatDayLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date().toISOString().split('T')[0];
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

    return recentTasks.map(dayData => ({
      dateISO: dayData.date,
      dayLabel: formatDayLabel(dayData.date),
      tasks: dayData.specialTasks.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
      })),
    }));
  }, [recentTasks]);

  const [currentPage, setCurrentPage] = useState(
    transformedDailyData.length > 0 ? transformedDailyData.length - 1 : 0,
  );
  const pagerRef = useRef<PagerView>(null);

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

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

  // Show empty state
  if (transformedDailyData.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={typography.body}>No tasks found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={
          transformedDailyData.length > 0 ? transformedDailyData.length - 1 : 0
        }
        onPageSelected={handlePageSelected}>
        {transformedDailyData.map((dayTasks, index) => (
          <View key={dayTasks.dateISO} style={styles.pageContainer}>
            <DayView dayTasks={dayTasks} onTaskToggle={handleTaskToggle} />
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicator */}
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
    backgroundColor: colors.background.light,
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
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
  taskItemText: {
    ...typography.bodyMedium,
    color: colors.text.blue,
    flex: 1,
    marginRight: spacing.sm, // Reduced margin for more compact layout
    lineHeight: 18, // Reduced line height for more compact text
    fontSize: 14, // Slightly smaller font for more compact layout
  },
  taskItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.forest,
    opacity: 0.8,
  },
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
    paddingBottom: spacing.sm,
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
