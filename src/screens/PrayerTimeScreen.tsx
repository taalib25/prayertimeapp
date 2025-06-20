import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Pressable,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import DailyTasksSelector from '../components/DailyTasksComponent/DailyTasksSelector';
import MonthlyChallengeContent from '../components/MonthViewComponent/MonthlyChallengeContent';
import ReminderSection from '../components/ReminderSection';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {getTodayDateString} from '../utils/helpers';
import CallWidget from '../components/CallWidget';
import PersonalMeeting from '../components/PersonalMeeting';
import FajrTimeChart from '../components/FajrTimeChart';
import {useUser} from '../hooks/useUser';
import UserService from '../services/UserService';

const PrayerTimeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, displayName, isLoading: userLoading} = useUser();
  const isLoading = prayerLoading || userLoading;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const userService = UserService.getInstance();

  const handleCallPreferenceSet = async (preference: boolean) => {
    try {
      console.log('Call preference set:', preference);

      // The preference is already saved in CallWidget,
      // but we can add additional logic here if needed
      // For example, scheduling notifications based on the preference
    } catch (error) {
      console.error('Error handling call preference:', error);
    }
  };

  // Extract mosque info from user
  const mosqueInfo = user
    ? {
        name: user.masjid,
        location: user.location,
      }
    : null;

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isLoading, fadeAnim]);

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
          location={user?.location || 'Location not set'}
          userName={displayName}
          mosqueName={user?.masjid || 'Local Mosque'}
          mosqueLocation={user?.location || 'Location not set'}
          avatarImage={require('../assets/images/profile.png')}
        />
        {/* Prayer Time Cards - always visible with proper structure */}
        <View style={styles.prayerCardsContainer}>
          {isLoading ? (
            <View style={styles.loadingCardsPlaceholder}>
              <ActivityIndicator
                size="large"
                color={colors.accent}
                style={styles.cardLoader}
              />
            </View>
          ) : (
            <Animated.View style={{opacity: fadeAnim}}>
              <PrayerTimeCards
                prayers={prayerTimes}
                selectedDate={selectedDate}
              />
            </Animated.View>
          )}
        </View>
        {/* Main content container - always visible */}
        <View style={styles.container}>
          {/* Section Header for Reminders - always visible */}
          <View style={{height: 110}} />
          <Animated.View style={{opacity: fadeAnim}}>
            <CallWidget onCallPreferenceSet={handleCallPreferenceSet} />
          </Animated.View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Reminders</Text>
            <Pressable
              onPress={handleSeeAllReminders}
              style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          {/* Content sections with loading states */}
          {isLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.accent}
                style={styles.loader}
              />
            </View>
          ) : (
            <Animated.View style={{opacity: fadeAnim}}>
              {/* Reminder Section */}
              <ReminderSection
                maxItems={4}
                onSeeAllPress={handleSeeAllReminders}
              />
              {/* Section Header for Tasks */}
              <DailyTasksSelector />
              {/* Monthly Challenge Cards with user goals */}
              <MonthlyChallengeContent
                userGoals={{
                  monthlyZikrGoal: user?.zikriGoal || 600,
                  monthlyQuranPagesGoal: user?.quranGoal || 30,
                }}
              />
              <FajrTimeChart />
            </Animated.View>
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
});

export default PrayerTimeScreen;
