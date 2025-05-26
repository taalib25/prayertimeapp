import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../utils/typography';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
  backgroundColor: string;
  progressValue?: number;
  progressTotal?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  backgroundColor,
  progressValue,
  progressTotal,
}) => {
  return (
    <View style={[styles.container, {backgroundColor}]}>
      <Text style={styles.title}>{title}</Text>

      {progressValue !== undefined && progressTotal !== undefined && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {progressValue}
            <Text style={styles.progressTotalText}>/{progressTotal}</Text>
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {width: `${(progressValue / progressTotal) * 100}%`},
              ]}
            />
          </View>
        </View>
      )}

      {stats.map((stat, index) => (
        <View key={index} style={styles.statRow}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 16,
    flex: 1,
    margin: 6,
  },
  title: {
    ...typography.bodyMedium,
    marginBottom: 10,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statLabel: {
    ...typography.body,
    color: '#555',
  },
  statValue: {
    ...typography.bodyMedium,
    color: '#333',
  },
  progressContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  progressText: {
    ...typography.statNumber,
    color: '#3BACB6',
  },
  progressTotalText: {
    ...typography.body,
    color: '#999',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    width: '100%',
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#3BACB6',
    borderRadius: 3,
  },
});

export default StatsCard;
