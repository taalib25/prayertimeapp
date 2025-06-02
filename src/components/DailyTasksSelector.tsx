import React, {useState, useRef} from 'react';
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

const SCREEN_WIDTH = Dimensions.get('window').width;

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

// Dynamic data for the last 3 days
const getMockData = (): DayTasks[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  const formatDateISO = (date: Date) => date.toISOString().split('T')[0];

  const formatDayLabel = (
    date: Date,
    isToday: boolean,
    isYesterday: boolean,
  ) => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return [
    {
      dateISO: formatDateISO(dayBefore),
      dayLabel: formatDayLabel(dayBefore, false, false),
      tasks: [
        {id: 'db1', title: 'FAJR at Masjid', completed: true},
        {id: 'db2', title: 'Read Surah Al-Kahf', completed: false},
        {id: 'db3', title: 'Give Charity', completed: true},
      ],
    },
    {
      dateISO: formatDateISO(yesterday),
      dayLabel: formatDayLabel(yesterday, false, true),
      tasks: [
        {id: 'y1', title: 'Morning Zikr', completed: true},
        {id: 'y2', title: 'Call Parents', completed: true},
        {id: 'y3', title: '100 x Asthagfirullah', completed: false},
        {id: 'y4', title: 'Plan for tomorrow', completed: true},
      ],
    },
    {
      dateISO: formatDateISO(today),
      dayLabel: formatDayLabel(today, true, false),
      tasks: [
        {id: 't1', title: 'FAJR at Masjid', completed: false},
        {
          id: 't2',
          title: '500 x La hawla wala kuwwatha illa billah',
          completed: false,
        },
        {id: 't3', title: '100 x Asthagfirullah', completed: false},
        {id: 't4', title: '15 mins of Quran', completed: false},
        {id: 't5', title: 'ISHA at Masjid', completed: false},
      ],
    },
  ];
};

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
  return (
    <View style={styles.dayViewContainer}>
      <Text style={styles.dayLabel}>{dayTasks.dayLabel}</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tasksScrollContainer}>
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
  const [dailyData, setDailyData] = useState<DayTasks[]>(getMockData());
  const [currentPage, setCurrentPage] = useState(
    dailyData.length > 0 ? dailyData.length - 1 : 0,
  );
  const pagerRef = useRef<PagerView>(null);

  const handleTaskToggle = (dateISO: string, taskId: string) => {
    setDailyData(prevData =>
      prevData.map(day => {
        if (day.dateISO === dateISO) {
          return {
            ...day,
            tasks: day.tasks.map(task =>
              task.id === taskId ? {...task, completed: !task.completed} : task,
            ),
          };
        }
        return day;
      }),
    );
  };

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={dailyData.length > 0 ? dailyData.length - 1 : 0}
        onPageSelected={handlePageSelected}>
        {dailyData.map((dayTasks, index) => (
          <View key={dayTasks.dateISO} style={styles.pageContainer}>
            <DayView dayTasks={dayTasks} onTaskToggle={handleTaskToggle} />
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicator */}
      <View style={styles.paginationContainer}>
        {dailyData.map((_, index) => (
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
    height: 380, // Increased from 350 to accommodate better spacing
    backgroundColor: colors.background.light,
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.md, // Increased from sm
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.sm, // Add padding to prevent cutoff
  },
  dayViewContainer: {
    flex: 1,
    paddingHorizontal: spacing.md, // Reduced to account for pageContainer padding
    paddingTop: spacing.sm,
  },
  tasksScrollContainer: {
    paddingBottom: spacing.lg, // Increased from md
    paddingTop: spacing.sm,
  },
  dayLabel: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md, // Increased from sm
    marginLeft: spacing.sm,
  },
  taskItemContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg, // Increased from md
    paddingHorizontal: spacing.lg, // Increased from md
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md, // Increased from sm
    marginHorizontal: spacing.sm, // Increased from xs to prevent cutoff
    shadowColor: colors.text.dark,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskItemCompleted: {
    backgroundColor: colors.sage, // Light green for completed tasks
    borderColor: colors.success,
    borderWidth: 1,
  },
  taskItemText: {
    ...typography.body,
    color: colors.text.dark,
    flex: 1,
    marginRight: spacing.md, // Added margin between text and radio button
    lineHeight: 20, // Added line height for better readability
  },
  taskItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.forest, // Darker green for completed text
    opacity: 0.8,
  },
  taskRadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskRadioCircleCompleted: {
    backgroundColor: colors.primary,
  },
  taskRadioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
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
