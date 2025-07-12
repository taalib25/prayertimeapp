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
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {BottomTabParamList} from '../navigation/BottomTabNavigator';
import {navigate} from '../../App'; // Import navigation helper

import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import CountdownTimer from '../components/CountdownTimer';
import ReminderSection from '../components/ReminderSection';
import CallWidget from '../components/CallWidget';
import AlertModal from '../components/AlertModel';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {getTodayDateString} from '../utils/helpers';
import {useUser} from '../hooks/useUser';
import {validateUserProfile} from '../utils/profileValidation';
import MonthlyChallengeContent from '../components/MonthViewComponent/MonthlyChallengeContent';
import MeetingDetailsCard from '../components/MeetingDetailsCard';
import PersonalMeeting from '../components/PersonalMeeting';
import StreakCounter from '../components/StreakCounter';

// Lazy loaded components
const DailyTasksSelector = React.lazy(
  () => import('../components/DailyTasksComponent/DailyTasksSelector'),
);
// const FajrTimeChart = React.lazy(() => import('../components/FajrTimeChart'));

const dummyMeeting = {
  id: 'meeting-001',
  title: 'Personal Meeting',
  description: 'Discussion about upcoming events and community initiatives',
  date: new Date(Date.now()).toISOString(), // 2 days from now
  time: '18:00',
  location: 'Main Prayer Hall',
  committeeMember: {
    name: 'Imam Abdullah',
    phone: '+1234567890'
  },
};




const PrayerTimeScreen = () => {
  const navigation =
    useNavigation<BottomTabNavigationProp<BottomTabParamList>>();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, hasSeenProfileAlert, markProfileAlertAsSeen} = useUser();
  // Simplified loading states - only two phases needed
  const [showAllContent, setShowAllContent] = useState(false);

  // Profile validation state
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [profileAlertMessage, setProfileAlertMessage] = useState('');

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

  // Profile validation when screen is focused
  useEffect(() => {
    // Only check profile validation if user data is loaded and user hasn't seen the alert
    if (user && !showProfileAlert && !hasSeenProfileAlert) {
      const validation = validateUserProfile(user);
      if (!validation.isComplete) {
        setProfileAlertMessage(validation.message);
        setShowProfileAlert(true);
      }
    }
  }, [user, showProfileAlert, hasSeenProfileAlert]);

  const handleCallPreferenceSet = useCallback(async () => {
    try {
      // The preference is already saved in CallWidget,
      // but we can add additional logic here if needed
      // For example, scheduling notifications based on the preference
    } catch (error) {
      console.error('Error handling call preference:', error);
    }
  }, []);

  // Profile alert handlers
  const handleProfileAlertConfirm = useCallback(async () => {
    setShowProfileAlert(false);
    // Mark alert as seen so it doesn't show again
    await markProfileAlertAsSeen();
    // Navigate to EditProfileScreen using the global navigation helper
    navigate('EditProfileScreen');
  }, [markProfileAlertAsSeen]);

  const handleProfileAlertCancel = useCallback(async () => {
    setShowProfileAlert(false);
    // Mark alert as seen so it doesn't show again when user dismisses it
    await markProfileAlertAsSeen();
  }, [markProfileAlertAsSeen]);

  const handleSeeAllReminders = useCallback(() => {
    console.log('user member id ', user?.memberId);
    navigation.navigate('Feeds');
  }, [navigation, user?.memberId]);

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
              <StreakCounter />
              <MonthlyChallengeContent
                userGoals={{
                  monthlyZikrGoal: user?.zikriGoal || 600,
                  monthlyQuranPagesGoal: user?.quranGoal || 30,
                }}
              />
              {/* <FajrTimeChart /> */}

              {/* <PersonalMeeting /> */}
              {user?.role === 'Member' ? (
                <MeetingDetailsCard meeting={dummyMeeting} />
              ) : (
                <PersonalMeeting />
              )}
            </Suspense>
          )}
        </View>
      </ScrollView>

      {/* Profile Validation Alert Modal */}
      <AlertModal
        visible={showProfileAlert}
        title="Complete Your Profile"
        message={profileAlertMessage}
        confirmText="Complete Profile"
        cancelText="Later"
        onConfirm={handleProfileAlertConfirm}
        onCancel={handleProfileAlertCancel}
      />
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
    color: '#0F3B0F',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countdownTimer: {
    ...typography.h2,
    fontSize: 36,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default PrayerTimeScreen;
