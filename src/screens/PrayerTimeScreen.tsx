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
import {getUserById} from '../services/db/UserServices';
import {getCurrentDateString} from '../utils/helpers';
import {
  initializeUserBackgroundTasks,
  checkBackgroundTasksHealth,
} from '../services/backgroundTasks';

const PrayerTimeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [userProfile, setUserProfile] = useState<any>(null);
  const {prayerTimes, isLoading, error} = usePrayerTimes(selectedDate);

  // Fetch user profile separately
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = await getUserById(1001);
        setUserProfile(user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Initialize background tasks when screen mounts
  useEffect(() => {
    const setupBackgroundServices = async () => {
      try {
        const userId = 1001; // Your default user ID

        // Check if background tasks need initialization
        const isHealthy = await checkBackgroundTasksHealth(userId);

        if (!isHealthy) {
          console.log(
            '🔄 Initializing background tasks from PrayerTimeScreen...',
          );
          await initializeUserBackgroundTasks(userId);
        }
      } catch (error) {
        console.error('Error setting up background services:', error);
      }
    };

    setupBackgroundServices();
  }, []);

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
          location={userProfile?.settings?.location}
          userName={userProfile?.profile?.username}
          mosqueName={userProfile?.settings?.masjid}
          mosqueLocation={userProfile?.settings?.masjid}
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
