import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface Task {
  id: string;
  title: string;
  completed: boolean;
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

const borderRadius = {
  md: 12,
};

const styles = StyleSheet.create({
  taskItemContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
    shadowColor: colors.text.dark,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
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
    marginRight: spacing.sm,
    lineHeight: 25,
    fontSize: 14,
  },
  taskItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.forest,
    opacity: 0.8,
  },
  taskItemTextDisabled: {},
  taskRadioCircle: {
    width: 20,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
});

export default TaskItem;
export type {Task, TaskItemProps};
