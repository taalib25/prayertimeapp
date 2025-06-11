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
// async function getLocation() {
//   return GetLocation.getCurrentPosition({
//     enableHighAccuracy: true,
//     timeout: 60000,
// })
// .then(location => {
//     console.log(location);
//     return {
//       latitude: location.latitude,
//       longitude: location.longitude,
//     };
// })
// .catch(error => {
//     const { code, message } = error;
//     console.warn(code, message);
// })
// }
const PrayerTimeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const {prayerTimes, isLoading: prayerLoading} = usePrayerTimes(selectedDate);
  const {user, isLoading: userLoading} = useUser({uid: 1001});
  const isLoading = prayerLoading || userLoading;

  console.log('Prayer Times:', user);
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

              <Text style={styles.seeAllText}>“Remind, indeed reminders benefit the believers”</Text>
              <Text style={styles.seeAllText}>(Quran 51:55)</Text>

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
    paddingTop: 40,
    marginTop: -150, // Move the container up to overlap with ~20% of the prayer cards
    zIndex: 1,
  },
  loader: {marginTop: 40},
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
    marginTop: 100,
    marginVertical: 16,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'right',
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
