import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {typography} from '../utils/typography';
import {colors} from '../utils/theme';

// Import new components
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import DailyTasksSelector from '../components/DailyTasksSelector';
import MonthlyChallengeSelector from '../components/PrayerWidgets/MonthlyTaskSelector';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useUser} from '../hooks/useUser';
import {getCurrentDateString} from '../utils/helpers';
import {
  initializeUserBackgroundTasks,
  checkBackgroundTasksHealth,
} from '../services/backgroundTasks';

const PrayerTimeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const {
    prayerTimes,
    isLoading: prayerLoading,
    error,
  } = usePrayerTimes(selectedDate);
  const {user, isLoading: userLoading, initializeUser} = useUser({uid: 1001});

  // Initialize user if not exists
  useEffect(() => {
    const setupUser = async () => {
      if (!userLoading && !user) {
        await initializeUser({
          username: 'Ahmed Hassan',
          email: 'ahmed@example.com',
          phoneNumber: '+1234567890',
        });
      }
    };

    setupUser();
  }, [user, userLoading, initializeUser]);

  const isLoading = prayerLoading || userLoading;

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
          location={user?.settings?.location || 'Loading...'}
          userName={user?.profile?.username || 'User'}
          mosqueName={user?.settings?.masjid || 'Al-Noor Mosque'}
          mosqueLocation={user?.settings?.location || 'City Center'}
          avatarImage={require('../assets/images/profile.png')}
        />

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.accent}
            style={styles.loader}
          />
        ) : (
          <View style={styles.container}>
            {/* Prayer Time Cards */}
            <PrayerTimeCards prayers={prayerTimes} />

            {/* New Today Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Reminders</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Empty cards placeholder */}
            <View style={styles.emptyCardsRow}>
              <View style={styles.emptyCard} />
              <View style={styles.emptyCard} />
            </View>

            {/* Section Header for Tasks */}
            <DailyTasksSelector />

            {/* Monthly Challenge Cards */}
            <MonthlyChallengeSelector />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.profilebg,
    paddingTop: 20,
    marginBottom: 80,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 14,
    overflow: 'hidden',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  emptyCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyCard: {
    height: 240,
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  tasksSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 8,
  },
});

export default PrayerTimeScreen;
