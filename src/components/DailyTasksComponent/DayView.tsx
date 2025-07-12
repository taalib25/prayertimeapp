import React, {useMemo} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';
import SpecialTasksList from './SpecialTasksList';

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

interface DayViewProps {
  dayTasks: DayTasks;
  onTaskToggle: (dateISO: string, taskId: string) => Promise<void>;
  isToday: boolean;
}

const DayView: React.FC<DayViewProps> = React.memo(
  ({dayTasks, onTaskToggle, isToday}) => {
    const shouldScroll = useMemo(
      () => dayTasks.tasks.length > 5,
      [dayTasks.tasks.length],
    );

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
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}>
          <SpecialTasksList
            dateISO={dayTasks.dateISO}
            onTaskToggle={onTaskToggle}
            isToday={true}
            actualTaskData={dayTasks.tasks}
          />
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  dayViewContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  scrollViewStyle: {
    flex: 1,
    maxHeight: 320,
  },
  tasksScrollContainer: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    minHeight: 340,
  },
  dayLabel: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
    lineHeight: 30,
  },
  dayLabelPast: {
    color: colors.text.prayerBlue,
    opacity: 0.9,
  },
});

export default DayView;
export type {DayTasks, DayViewProps};
