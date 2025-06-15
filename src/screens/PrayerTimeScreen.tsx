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
import DailyTasksSelector from '../components/DailyTasksSelector';
import MonthlyChallengeSelector from '../components/PrayerWidgets/MonthlyTaskSelector';
import ReminderSection from '../components/ReminderSection';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useUser} from '../hooks/useUser';
import {getCurrentDateString} from '../utils/helpers';

const handleCallPreferenceSet = (preference: boolean) => {
  console.log('Call preference set:', preference);
};

const PrayerTimeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, isLoading: userLoading} = useUser({uid: 1001});
  const isLoading = prayerLoading || userLoading;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
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
          location={user?.settings?.location}
          userName={user?.profile?.username}
          mosqueName={user?.settings?.masjid}
          mosqueLocation={user?.settings?.location}
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
              <PrayerTimeCards prayers={prayerTimes} />
            </Animated.View>
          )}
        </View>

        {/* Main content container - always visible */}
        <View style={styles.container}>
          {/* Section Header for Reminders - always visible */}
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
              <MonthlyChallengeSelector userGoals={user?.goals} />
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
    zIndex: 1000,
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
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});

export default PrayerTimeScreen;
