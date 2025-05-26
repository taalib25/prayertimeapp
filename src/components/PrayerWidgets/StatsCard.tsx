import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../../utils/typography';

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

// Title component for the stats card
const CardTitle: React.FC<{title: string}> = ({title}) => (
  <Text style={styles.title}>{title}</Text>
);

// Progress indicator component
const ProgressIndicator: React.FC<{
  value: number;
  total: number;
}> = ({value, total}) => (
  <View style={styles.progressContainer}>
    <Text style={styles.progressText}>
      {value}
      <Text style={styles.progressTotalText}>/{total}</Text>
    </Text>
    <View style={styles.progressBarBackground}>
      <View
        style={[styles.progressBar, {width: `${(value / total) * 100}%`}]}
      />
    </View>
  </View>
);

// Individual stat row component
const StatRow: React.FC<{stat: StatItem}> = ({stat}) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{stat.label}</Text>
    <Text style={styles.statValue}>{stat.value}</Text>
  </View>
);

// Stats list component
const StatsList: React.FC<{stats: StatItem[]}> = ({stats}) => (
  <>
    {stats.map((stat, index) => (
      <StatRow key={index} stat={stat} />
    ))}
  </>
);

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  backgroundColor,
  progressValue,
  progressTotal,
}) => {
  return (
    <View style={[styles.container, {backgroundColor}]}>
      <CardTitle title={title} />

      {progressValue !== undefined && progressTotal !== undefined && (
        <ProgressIndicator value={progressValue} total={progressTotal} />
      )}

      <StatsList stats={stats} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 16,
    fontWeight: '600',
    color: '#3C4A9B',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  statLabel: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 14,
    fontWeight: '400',
    color: '#3C4A9B',
  },
  statValue: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 14,
    fontWeight: '700',
    color: '#3C4A9B',
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
