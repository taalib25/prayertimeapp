import React, {useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {DAILY_SPECIAL_TASKS, EnhancedSpecialTask} from './specialTasks';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';

/**
 * Simple task item component for special daily tasks
 */
interface SpecialTaskItemProps {
  task: EnhancedSpecialTask;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const SpecialTaskItem: React.FC<SpecialTaskItemProps> = React.memo(
  ({task, color, onPress, disabled = false}) => {
    console.log(
      `🔧 SpecialTaskItem render: ${task.id}, completed: ${task.completed}, disabled: ${disabled}`,
    );

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          task.completed && styles.taskCompleted,
          disabled && styles.taskDisabled,
        ]}
        onPress={() => {
          console.log(
            `🔘 TouchableOpacity pressed: ${task.id}, disabled: ${disabled}`,
          );
          if (!disabled) {
            onPress();
          }
        }}
        disabled={disabled}
        activeOpacity={0.7}>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted,
            ]}>
            {task.title}
          </Text>
        </View>

        <View
          style={[
            styles.statusIndicator,
            {backgroundColor: task.completed ? color : colors.white},
            task.completed && {borderColor: color, backgroundColor: color},
          ]}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  },
);

interface SpecialTasksListProps {
  dateISO: string;
  onTaskToggle: (dateISO: string, taskId: string) => Promise<void>;
  isToday?: boolean;
  actualTaskData?: any[]; // Tasks from the database for this date
}

/**
 * Component that renders the list of special daily tasks
 * ✅ SIMPLIFIED: Basic functionality without complex optimizations
 */
const SpecialTasksList: React.FC<SpecialTasksListProps> = React.memo(
  ({dateISO, onTaskToggle, isToday = false, actualTaskData = []}) => {
    // ✅ SIMPLE: Basic task data transformation
    const specialTasks: EnhancedSpecialTask[] = React.useMemo(() => {
      return DAILY_SPECIAL_TASKS.map(task => {
        // Find if this task has completion data in actualTaskData
        const actualTask = actualTaskData.find(stored => stored.id === task.id);
        return {
          ...task,
          completed: actualTask ? actualTask.completed : false,
        };
      });
    }, [actualTaskData]);

    // ✅ SIMPLE: Task press handler
  const handleTaskPress = useCallback(
    async (taskId: string) => {
      console.log(`🔘 Task pressed: ${taskId}, date: ${dateISO}`);

      // Allow editing all three days (day before yesterday, yesterday, today)
      try {
        console.log(`🔄 Calling onTaskToggle for ${taskId}`);
        await onTaskToggle(dateISO, taskId);
        console.log(`✅ Task toggle completed for ${taskId}`);
      } catch (error) {
        console.error('❌ Error toggling task:', error);
      }
    },
      [isToday, onTaskToggle, dateISO],
    );

    // ✅ SIMPLE: Basic color mapping
    const getTaskColor = useCallback((category: string): string => {
      switch (category) {
        case 'prayer':
          return colors.primary;
        case 'quran':
          return colors.primary;
        case 'zikr':
          return colors.warning;
        default:
          return colors.primary;
      }
    }, []);

    return (
      <View style={styles.container}>
        {specialTasks.map(task => {
          console.log(
            `📝 Rendering task: ${task.id}, completed: ${task.completed}, isToday: ${isToday}`,
          );
          return (
            <SpecialTaskItem
              key={task.id}
              task={task}
              color={getTaskColor(task.category)}
              onPress={() => {
                console.log(`🔘 SpecialTaskItem pressed: ${task.id}`);
                handleTaskPress(task.id);
              }}
              disabled={!isToday}
            />
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: colors.text.dark,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCompleted: {
    backgroundColor: colors.sage,
    borderColor: colors.success,
    borderWidth: 1,
  },
  taskDisabled: {
    opacity: 0.5,
  },
  taskContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
    ...typography.h3,
    color: colors.text.blue,
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.forest,
    opacity: 0.8,
  },
  taskInfo: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 12,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SpecialTasksList;
