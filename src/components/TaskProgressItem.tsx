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
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>

        {completed ? (
          <View style={styles.completedBadge}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>

      <View style={[styles.progressSection, {flexDirection: 'row', alignItems: 'center', marginTop: 0}]}>
        <Text style={[styles.progressText, {marginBottom: 0, marginRight: 13}]}>
          {current}/{total}
        </Text>

        <View style={[styles.progressBarContainer, {flex: 1}]}>
          <View
        style={[
          styles.progressBar,
          {width: `${(current / total) * 100}%`, backgroundColor: color},
        ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    paddingVertical: 14,
    marginVertical: 6,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding:1,
  },
  title: {
    ...typography.taskTitle,
    marginBottom:1,
    color: '#3C4A9B',
    flex: 1,
  },
  progressSection: {
    marginTop: 4,
  },
  progressText: {
    ...typography.prayerCard,
    fontSize: 14,
    color: '#3C4A9B',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 11, // Increased from 6 to 8
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 11, // Increased from 6 to 8
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCircle:{
    borderColor:'#CBCBCB',
    borderWidth: 1, 
    borderRadius: 100,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TaskProgressItem;
