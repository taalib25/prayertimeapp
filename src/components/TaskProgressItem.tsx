import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../utils/typography';

interface TaskProgressItemProps {
  title: string;
  current: number;
  total: number;
  color: string;
  completed?: boolean;
}

const TaskProgressItem: React.FC<TaskProgressItemProps> = ({
  title,
  current,
  total,
  color,
  completed,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.progressDetails}>
        <Text style={styles.progressText}>
          {current}/{total}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {width: `${(current / total) * 100}%`, backgroundColor: color},
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    ...typography.bodyMedium,
    color: '#333',
  },
  completedBadge: {
    backgroundColor: '#4CD964',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  progressText: {
    ...typography.caption,
    color: '#777',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});

export default TaskProgressItem;
