import React, {useState, useEffect, useCallback, Suspense} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import CountdownTimer from '../components/CountdownTimer';
import ReminderSection from '../components/ReminderSection';
import CallWidget from '../components/CallWidget';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {getTodayDateString} from '../utils/helpers';
import {useUser} from '../hooks/useUser';
import MonthlyChallengeContent from '../components/MonthViewComponent/MonthlyChallengeContent';
import MeetingDetailsCard from '../components/MeetingDetailsCard';
import PersonalMeeting from '../components/PersonalMeeting';

// Lazy loaded components
const DailyTasksSelector = React.lazy(
  () => import('../components/DailyTasksComponent/DailyTasksSelector'),
);
const FajrTimeChart = React.lazy(() => import('../components/FajrTimeChart'));

// Dummy meeting data for testing
const dummyMeeting = {
  title: 'Monthly Committee Meeting',
  isUrgent: true,
  date: new Date().toISOString(),
  time: '7:30 PM',
  committeeMember: {
    name: 'Imam Ahmad',
    phone: '+1234567890',
  },
};

// Dummy data for PersonalMeeting (list)
const dummyPersonalMeetings = [
  {
    member_id: 1,
    member_name: 'Member One',
    member_phone: '+94-77-123-4567',
    scheduled_date: '2024-12-25T00:00:00.000Z',
    scheduled_time: '15:00:00',
    priority: 'high',
    member_username: 'testmember1',
    counsellor_username: 'amer',
  },
  {
    member_id: 2,
    member_name: 'Member Two',
    member_phone: '+94-77-123-4568',
    scheduled_date: '2024-12-26T00:00:00.000Z',
    scheduled_time: '16:00:00',
    priority: 'medium',
    member_username: 'testmember2',
    counsellor_username: 'amer',
  },
  {
    member_id: 3,
    member_name: 'Member Three',
    member_phone: '+94-77-123-4569',
    scheduled_date: '2024-12-27T00:00:00.000Z',
    scheduled_time: '17:00:00',
    priority: 'low',
    member_username: 'testmember3',
    counsellor_username: 'amer',
  },
];

const PrayerTimeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user} = useUser();
  // Simplified loading states - only two phases needed
  const [showAllContent, setShowAllContent] = useState(false);

  // Core content shows immediately when prayer times are ready
  const showPrimaryContent = !prayerLoading;

  // Find the active prayer for the countdown display
  const activePrayer = React.useMemo(() => {
    return prayerTimes.find(prayer => prayer.isActive);
  }, [prayerTimes]);

  // Check if selected date is today
  const isToday = React.useMemo(() => {
    return selectedDate === getTodayDateString();
  }, [selectedDate]);

  // Single delayed load for heavy components only
  useEffect(() => {
    if (showPrimaryContent) {
      // Load heavy components after prayer times are rendered
      const timer = setTimeout(() => {
        setShowAllContent(true);
      }, 150); // Minimal delay, just enough to show prayer times first

      return () => clearTimeout(timer);
    }
  }, [showPrimaryContent]);

  const handleCallPreferenceSet = useCallback(async () => {
    try {
      // The preference is already saved in CallWidget,
      // but we can add additional logic here if needed
      // For example, scheduling notifications based on the preference
    } catch (error) {
      console.error('Error handling call preference:', error);
    }
  }, []);

  const handleSeeAllReminders = useCallback(() => {
    console.log('user member id ', user?.memberId);
    navigation.navigate('Feeds' as never);
  }, [navigation]);

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <ScrollView style={styles.scrollContainer}>
        {/* Header with user profile and mosque info */}
        <Header />
        {/* Prayer Time Cards - Priority 1: Show immediately when available */}
        <View style={styles.prayerCardsContainer}>
          {!showPrimaryContent ? (
            <View style={styles.loadingCardsPlaceholder}>
              <ActivityIndicator
                size="large"
                color={colors.accent}
                style={styles.cardLoader}
              />
            </View>
          ) : (
            <PrayerTimeCards
              prayers={prayerTimes}
              selectedDate={selectedDate}
            />
          )}
        </View>
        {/* Main content container - always visible */}
        <View style={styles.container}>
          {/* Section Header for Reminders - always visible */}
          <View style={{height: 110}} />
          {/* Countdown Timer Section - Priority 2: Show after prayer times */}
          {showPrimaryContent && activePrayer && isToday && (
            <View style={styles.countdownSection}>
              <View style={styles.countdownCard}>
                <View style={styles.countdownHeader}>
                  <View style={styles.nextPrayerRow}>
                    {/* <Text style={styles.clockIcon}>⏰</Text> */}
                    <Text style={styles.nextPrayerText}>Next Prayer</Text>
                  </View>
                </View>
                <CountdownTimer
                  targetTime={activePrayer.time}
                  isActive={true}
                  style={styles.countdownTimer}
                />
              </View>
            </View>
          )}
          {/* CallWidget - Priority 3: Show after countdown */}
          {showPrimaryContent && (
            <CallWidget onCallPreferenceSet={handleCallPreferenceSet} />
          )}
          {/* Daily Reminders Section - Priority 4 */}
          {showPrimaryContent && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Reminders</Text>
                <Pressable
                  onPress={handleSeeAllReminders}
                  style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <ReminderSection
                maxItems={4}
                onSeeAllPress={handleSeeAllReminders}
              />
            </>
          )}
          {/* Heavy Content - Load after initial render */}
          {showAllContent && (
            <Suspense
              fallback={
                <View style={styles.contentLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              }>
              <DailyTasksSelector />
              <MonthlyChallengeContent
                userGoals={{
                  monthlyZikrGoal: user?.zikriGoal || 600,
                  monthlyQuranPagesGoal: user?.quranGoal || 30,
                }}
              />
              <FajrTimeChart />

              <PersonalMeeting />
              {/* {user?.role === 'Member' ? (
                <MeetingDetailsCard meeting={dummyMeeting} />
              ) : (
                <PersonalMeeting meeting={dummyPersonalMeeting} />
              } */}
            </Suspense>
          )}
        </View>
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
    zIndex: 20,
    elevation: 20,
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 15,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    paddingTop: 7,
    marginTop: -120,
    zIndex: 10,
    elevation: 10,
    paddingBottom: 140,
    position: 'relative',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    zIndex: 30,
    position: 'relative',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 6,
    zIndex: 50,
    position: 'relative',
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  loader: {marginTop: 40},
  cardLoader: {
    marginTop: 60,
    marginBottom: 40,
  },
  loadingCardsPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 8,
  },
  contentLoadingContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callWidgetPlaceholder: {
    height: 120,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  countdownSection: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 2,
    marginBottom: 3,
    alignItems: 'center',
  },
  countdownCard: {
    backgroundColor: '#E8F8E8', // Lighter green background for more contrast
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8E6B8', // More defined green border
    shadowColor: '#2D5A2D', // Dark green shadow
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  countdownHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nextPrayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.8,
  },
  nextPrayerText: {
    ...typography.bodySmall,
    color: '#1A4D1A', // Darker green for better contrast
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  prayerNameText: {
    ...typography.h2,
    color: '#0F3B0F', // Very dark green for prayer name
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countdownTimer: {
    ...typography.h2,
    fontSize: 36,
    color: colors.primary, // Slightly darker green for better readability
    textAlign: 'center',
    // marginVertical: 12,
    letterSpacing: 1,
  },
});

export default PrayerTimeScreen;
