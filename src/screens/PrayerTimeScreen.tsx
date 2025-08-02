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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {BottomTabParamList} from '../navigation/BottomTabNavigator';
import {navigate} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import CountdownTimer from '../components/CountdownTimer';
import ReminderSection from '../components/ReminderSection';
import CallWidget from '../components/CallWidget';
import AlertModal from '../components/AlertModel';
import {getTodayDateString} from '../utils/helpers';
import {useUser} from '../hooks/useUser';
import {validateUserProfile} from '../utils/profileValidation';
import MonthlyChallengeContent from '../components/MonthViewComponent/MonthlyChallengeContent';
import MeetingDetailsCard from '../components/MeetingDetailsCard';
import PersonalMeeting from '../components/PersonalMeeting';
import StreakCounter from '../components/StreakCounter';
import UserService from '../services/UserService';
import {PrayerTime} from '../utils/types';

const DailyTasksSelector = React.lazy(
  () => import('../components/DailyTasksComponent/DailyTasksSelector'),
);

const PrayerTimeScreen = () => {
  const navigation =
    useNavigation<BottomTabNavigationProp<BottomTabParamList>>();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [showAllContent, setShowAllContent] = useState(false);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [prayerLoading, setPrayerLoading] = useState(true);

  const {user, hasSeenProfileAlert, markProfileAlertAsSeen} = useUser();
  const userService = UserService.getInstance();

  // Load prayer times for the selected date
  const loadPrayerTimes = useCallback(async () => {
    try {
      setPrayerLoading(true);
      const prayerTimesData = await userService.getPrayerTimesForDate(
        selectedDate,
      );

      if (prayerTimesData) {
        const currentTime = new Date();
        const currentMinutes =
          currentTime.getHours() * 60 + currentTime.getMinutes();
        const isToday = selectedDate === getTodayDateString();

        const formattedPrayers: PrayerTime[] = [
          {name: 'fajr', displayName: 'Fajr', time: prayerTimesData.fajr},
          {name: 'dhuhr', displayName: 'Dhuhr', time: prayerTimesData.dhuhr},
          {name: 'asr', displayName: 'Asr', time: prayerTimesData.asr},
          {
            name: 'maghrib',
            displayName: 'Maghrib',
            time: prayerTimesData.maghrib,
          },
          {name: 'isha', displayName: 'Isha', time: prayerTimesData.isha},
        ];

        // Calculate total minutes for each prayer for comparison
        const prayersWithMinutes = formattedPrayers.map(prayer => {
          const [hours, minutes] = prayer.time.split(':').map(Number);
          return {
            ...prayer,
            totalMinutes: hours * 60 + minutes,
          };
        });

        // Find the active prayer (next upcoming prayer) only for today
        if (isToday) {
          let activePrayerIndex = -1;
          let minDifference = Infinity;

          for (let i = 0; i < prayersWithMinutes.length; i++) {
            const prayerMinutes = prayersWithMinutes[i].totalMinutes;

            if (prayerMinutes > currentMinutes) {
              const difference = prayerMinutes - currentMinutes;
              if (difference < minDifference) {
                minDifference = difference;
                activePrayerIndex = i;
              }
            }
          }

          // If no prayer is found for today (all prayers have passed),
          // the next prayer is Fajr of tomorrow - but don't set any as active for today
          if (activePrayerIndex !== -1) {
            // Set isActive for the active prayer
            formattedPrayers.forEach((prayer, index) => {
              prayer.isActive = index === activePrayerIndex;
            });
          }
        } else {
          // For non-today dates, don't set any prayer as active
          formattedPrayers.forEach(prayer => {
            prayer.isActive = false;
          });
        }

        setPrayers(formattedPrayers);
      } else {
        console.warn(`No prayer times found for date: ${selectedDate}`);
        setPrayers([]);
      }
    } catch (error) {
      console.error('Error loading prayer times:', error);
      setPrayers([]);
    } finally {
      setPrayerLoading(false);
    }
  }, [selectedDate, userService]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  // Update active prayer every minute only for today
  useEffect(() => {
    const isToday = selectedDate === getTodayDateString();
    if (!isToday || prayers.length === 0) return;

    const interval = setInterval(() => {
      loadPrayerTimes(); // Reload to recalculate active prayer
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [prayers.length, selectedDate, loadPrayerTimes]);

  const activePrayer = prayers.find(prayer => prayer.isActive);
  const isToday = selectedDate === getTodayDateString();
  const showPrimaryContent = !prayerLoading;
  console.log('Prayer times:', prayers, 'Active prayer:', activePrayer);
  useEffect(() => {
    if (showPrimaryContent) {
      const timer = setTimeout(() => setShowAllContent(true), 150);
      return () => clearTimeout(timer);
    }
  }, [showPrimaryContent]);

  useEffect(() => {
    if (user && !hasSeenProfileAlert) {
      const validation = validateUserProfile(user);
      if (!validation.isComplete) {
        setShowProfileAlert(true);
      }
    }

    console.log(
      'User profile validation:',
      activePrayer,
      showPrimaryContent,
      prayers,
    );
  }, [user, hasSeenProfileAlert]);

  const handleCallPreferenceSet = useCallback(async () => {
    try {
      // Additional logic can be added here if needed
    } catch (error) {
      console.error('Error handling call preference:', error);
    }
  }, []);

  const handleProfileAlert = useCallback(
    async (shouldNavigate = false) => {
      setShowProfileAlert(false);
      await markProfileAlertAsSeen();
      if (shouldNavigate) navigate('EditProfileScreen');
    },
    [markProfileAlertAsSeen],
  );

  const handleSeeAllReminders = useCallback(() => {
    navigation.navigate('Feeds');
  }, [navigation]);

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: 0,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      {/* <StatusBar barStyle="light-content" backgroundColor="transparent" translucent /> */}

      <ScrollView style={styles.scrollContainer}>
        <Header />

        <View style={styles.prayerCardsContainer}>
          <PrayerTimeCards
            selectedDate={selectedDate}
            prayers={prayers}
            isLoading={prayerLoading}
            onPrayersLoad={loadPrayerTimes}
          />
        </View>

        <View style={styles.container}>
          <View style={{height: 110}} />

          {showPrimaryContent && activePrayer && isToday && (
            <View style={styles.countdownSection}>
              <View style={styles.countdownCard}>
                <View style={styles.countdownHeader}>
                  <View style={styles.nextPrayerRow}>
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

          {showPrimaryContent && (
            <CallWidget onCallPreferenceSet={handleCallPreferenceSet} />
          )}

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

          {showAllContent && (
            <Suspense
              fallback={
                <View style={styles.contentLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              }>
              <DailyTasksSelector prayerTimes={prayers} />
              <StreakCounter />
              <MonthlyChallengeContent
                userGoals={{
                  monthlyZikrGoal: user?.zikriGoal || 600,
                  monthlyQuranPagesGoal: user?.quranGoal || 30,
                }}
              />
              {user?.role === 'Member' ? (
                <MeetingDetailsCard />
              ) : (
                <PersonalMeeting />
              )}
            </Suspense>
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={showProfileAlert}
        title="Complete Your Profile"
        message="Please complete your profile to get the best experience."
        confirmText="Complete"
        cancelText="Later"
        onConfirm={() => handleProfileAlert(true)}
        onCancel={() => handleProfileAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.profilebg,
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
  },
  contentLoadingContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#E8F8E8',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8E6B8',
    shadowColor: '#2D5A2D',
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
  nextPrayerText: {
    ...typography.bodySmall,
    color: '#1A4D1A',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
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
