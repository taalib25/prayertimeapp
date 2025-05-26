import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ZikrCounterProps {
  todayCount: number;
  totalCount: number;
  backgroundColor?: string;
}

const ZikrCounter: React.FC<ZikrCounterProps> = ({
  todayCount,
  totalCount,
  backgroundColor = '#FFF2F2', // Default light pink color as shown in the image
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  title: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 18,
    fontWeight: '600',
    color: '#3C4A9B', // Purple color as shown in the image
    marginBottom: 12,
  },
  countContainer: {
    alignItems: 'flex-end',
  },
  countItem: {
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  countLabel: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 14,
    fontWeight: '400',
    color: '#3C4A9B',
    marginBottom: 2,
  },
  countValue: {
    fontFamily: 'Sora-VariableFont_wght',
    fontSize: 28,
    fontWeight: '700',
    color: '#3C4A9B',
  },
});

export default ZikrCounter;