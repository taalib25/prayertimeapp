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

const PrayerTimeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, isLoading: userLoading} = useUser({uid: 1001});
  const isLoading = prayerLoading || userLoading;

  const handleSeeAllReminders = () => {
    console.log('See All Reminders Pressed');
    Alert.alert('Feature Under Development');
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
                <TouchableOpacity
                  onPress={handleSeeAllReminders}
                  style={styles.seeAllButton}
                  activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

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
    marginBottom: 80,
  },
  scrollContainer: {
    flex: 1,
  },
  prayerCardsContainer: {
    zIndex: 2,
    marginHorizontal: 16,
    marginTop: -25,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 7,
    marginTop: -195,
    zIndex: 1,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 120,
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllButton: {
    padding: 8,
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
