import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView} from 'react-native';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import MeetingCard from '../components/MeetingCard';

const ZikrScreen: React.FC = () => {
  const dailyZikr = {
    title: 'Daily Remembrance',
    subtitle: "Today's Dhikr",
    persons: [
      {name: 'Morning Adhkar', phone: 'Completed 0/7', completed: false},
      {name: 'Evening Adhkar', phone: 'Completed 0/7', completed: false},
      {name: 'After Prayer', phone: 'Completed 0/5', completed: false},
    ],
    stats: [
      {label: 'Total', value: '19'},
      {label: 'Completed', value: '0'},
      {label: 'Remaining', value: '19'},
    ],
  };

  const recommendedZikr = {
    title: 'Recommended Dhikr',
    subtitle: 'Anytime',
    stats: [
      {label: 'Subhan Allah', value: '33x'},
      {label: 'Alhamdulillah', value: '33x'},
      {label: 'Allahu Akbar', value: '34x'},
    ],
  };

  const handleZikrPress = (zikr: any, index: number) => {
    console.log(`Selected Zikr ${index + 1}`);
  };

  return (
    <SafeAreaView style={styles.container}>
     <View style={styles.header}>
          <Text style={styles.headerTitle}>Zikr Screen</Text>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.md,
    justifyContent: 'center',
  
    alignItems: 'center',

  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});

export default ZikrScreen;
