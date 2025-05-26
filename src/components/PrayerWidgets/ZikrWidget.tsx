import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../../utils/typography';

interface ZikrCounterProps {
  todayCount: number;
  totalCount: number;
  backgroundColor?: string;
}

const ZikrCounter: React.FC<ZikrCounterProps> = ({
  todayCount,
  totalCount,
  backgroundColor = '#FFE6E6',
}) => {
  return (
    <View style={[styles.container, {backgroundColor}]}>
      <Text style={styles.title}>Zikr</Text>

      <View style={styles.countContainer}>
        <View style={styles.countItem}>
          <Text style={styles.countLabel}>Today Zikr</Text>
          <Text style={styles.countValue}>{todayCount}</Text>
        </View>

        <View style={styles.countItem}>
          <Text style={styles.countLabel}>Total Zikr</Text>
          <Text style={styles.countValue}>{totalCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1, // Makes it flexible within parent
    margin: 6, // Adds consistent spacing
    minHeight: 120, // Ensures minimum height
  },
  title: {
    ...typography.prayerCard,
    color: '#3C4A9B', // Purple color as shown in the image
    marginBottom: 12,
  },
  countContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  countItem: {
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  countLabel: {
    ...typography.body,
    color: '#3C4A9B',
    marginBottom: 2,
  },
  countValue: {
    ...typography.count,
    color: '#3C4A9B',
  },
});

export default ZikrCounter;
