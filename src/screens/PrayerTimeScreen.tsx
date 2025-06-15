import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import DailyTasksSelector from '../components/DailyTasksSelector';
import MonthlyChallengeSelector from '../components/PrayerWidgets/MonthlyTaskSelector';
import ReminderSection from '../components/ReminderSection';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useUser} from '../hooks/useUser';
import {getCurrentDateString} from '../utils/helpers';
import CallWidget from '../components/CallWidget';

const handleCallPreferenceSet = (preference: boolean) => {
  console.log('Call preference set:', preference);
  // Handle the call preference here
};

const PrayerTimeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, isLoading: userLoading} = useUser({uid: 1001});
  const isLoading = prayerLoading || userLoading;

  const handleSeeAllReminders = () => {
    console.log('See All Reminders Pressed');
    navigation.navigate('Feeds' as never);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <ScrollView style={styles.scrollContainer}>
        {/* Header with user profile and mosque info */}
        <Header
          location={user?.settings?.location}
          userName={user?.profile?.username}
          mosqueName={user?.settings?.masjid}
          mosqueLocation={user?.settings?.location}
          avatarImage={require('../assets/images/profile.png')}
        />

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.accent}
            style={styles.loader}
          />
        ) : (
          <>
            {/* Prayer Time Cards - positioned to overlap */}
            <View style={styles.prayerCardsContainer}>
              <PrayerTimeCards prayers={prayerTimes} />
            </View>

            <View style={styles.container}>
              {/* Section Header for Reminders - moved from ReminderSection */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Reminders</Text>
                <Pressable
                  onPress={handleSeeAllReminders}
                  style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={handleSeeAllReminders}
                style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
              {/* Reminder Section */}
              <ReminderSection
                maxItems={4}
                onSeeAllPress={handleSeeAllReminders}
              />

              {/* Section Header for Tasks */}
              <DailyTasksSelector />

              {/* Monthly Challenge Cards with user goals */}
              <MonthlyChallengeSelector userGoals={user?.goals} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.profilebg,
    paddingTop: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  prayerCardsContainer: {
    zIndex: 10, // Highest zIndex to be on top of everything
    elevation: 10, // Corresponding elevation for Android
    marginHorizontal: 16,
    marginTop: -25,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 7,
    marginTop: -195, // Maintained original marginTop for UI consistency
    zIndex: 1, // Lower zIndex, content will be under prayerCardsContainer
    elevation: 1, // Corresponding elevation for Android
    paddingBottom: 140, // Increased padding to account for tab bar
    position: 'relative', // Added for robust zIndex behavior
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Maintained original paddingHorizontal
    marginTop: 150, // Maintained original marginTop
    marginBottom: 16,
    zIndex: 2, // zIndex relative to parent 'container'
    position: 'relative',
    elevation: 2, // zIndex relative to parent 'container'
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllButton: {
    padding: 8, // Maintained original padding
    borderRadius: 6,
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  loader: {marginTop: 40},
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});

export default PrayerTimeScreen;
