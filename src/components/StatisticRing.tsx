import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface StatisticRingProps {
  title: string;
  current: number;
  total: number;
  color: string;
  backgroundColor: string;
  unit?: string;
}

const StatisticRing: React.FC<StatisticRingProps> = ({
  title,
  current,
  total,
  color,
  backgroundColor,
  unit = '',
}) => {
  const percentage = (current / total) * 100;

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.ringContainer}>
        <View style={styles.ring}>
          <Text style={styles.currentValue}>{current}</Text>
          <Text style={styles.totalValue}>
            {unit ? `${total} ${unit}` : total}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 4,
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,

    color: '#666',
    marginBottom: 12,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 10,
    color: '#666',
  },
});

export default StatisticRing;
