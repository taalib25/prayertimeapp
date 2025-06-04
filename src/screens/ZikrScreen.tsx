import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Button,
} from 'react-native';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import MeetingCard from '../components/MeetingCard';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ZikrScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

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

  const navigateToDatabaseTest = () => {
    navigation.navigate('DatabaseTest');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zikr Screen</Text>
      </View>
      <Button title="Go to Database Test" onPress={navigateToDatabaseTest} />
      {/* You can add your Zikr content here using MeetingCard or other components */}
      {/* Example:
      <ScrollView style={styles.content}>
        <MeetingCard
          title={dailyZikr.title}
          subtitle={dailyZikr.subtitle}
          persons={dailyZikr.persons}
          stats={dailyZikr.stats}
          onCardPress={() => console.log('Daily Zikr card pressed')}
          onPersonPress={handleZikrPress}
        />
        <MeetingCard
          title={recommendedZikr.title}
          subtitle={recommendedZikr.subtitle}
          stats={recommendedZikr.stats}
          onCardPress={() => console.log('Recommended Zikr card pressed')}
          // Recommended Zikr might not have individual person press actions
        />
        <View style={styles.bottomSpacing} />
      </ScrollView>
      */}
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
