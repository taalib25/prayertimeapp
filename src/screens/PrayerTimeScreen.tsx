import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';

// Import new components
import Header from '../components/Header';
import PrayerTimeCards from '../components/PrayerTimeCards';
import StatsCard from '../components/PrayerWidgets/StatsCard';
import TaskProgressItem from '../components/TaskProgressItem';
import ZikrCounter from '../components/PrayerWidgets/ZikrWidget';

// Dummy prayer times data to match the image
const DUMMY_PRAYER_TIMES = [
  {name: 'fajr', displayName: 'Fajr', time: '04:41', isActive: false},
  {name: 'dhuhr', displayName: 'Dhuhr', time: '12:10', isActive: false},
  {name: 'asr', displayName: 'Asr', time: '03:23', isActive: false},
  {name: 'maghrib', displayName: 'Maghrib', time: '06:20', isActive: true},
  {name: 'isha', displayName: 'Isha', time: '07:30', isActive: false},
];

type PrayerTimeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainApp'
>;

const PrayerTimeScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<PrayerTimeScreenNavigationProp>();

  // Format prayer times for the cards component
  const formatPrayerTimesForCards = () => {
    return DUMMY_PRAYER_TIMES.map(prayer => ({
      name: prayer.name.toLowerCase(),
      displayName: prayer.displayName,
      time: prayer.time,
      isActive: prayer.isActive,
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header with user profile and mosque info */}
        <Header
          location="Colombo, Sri Lanka"
          userName="Mohamed Hijaz"
          mosqueName="Masjid Ul Jabbar Jumma Masjid"
          mosqueLocation="Gothatuwa"
        />

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#3BACB6"
            style={styles.loader}
          />
        ) : (
          <View style={styles.container}>
            {/* Prayer Time Cards */}
            <PrayerTimeCards prayers={DUMMY_PRAYER_TIMES} />

            {/* New Today Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Today</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Empty cards placeholder */}
            <View style={styles.emptyCardsRow}>
              <View style={styles.emptyCard} />
              <View style={styles.emptyCard} />
            </View>

            {/* Stats Cards Row */}
            <View style={styles.statsCardsRow}>
              {/* Challenge 40 Card */}
              <StatsCard
                title="Challenge 40"
                stats={[]}
                backgroundColor="#e4fbff"
                progressValue={154}
                progressTotal={175}
              />

              {/* Wake up Calls Card */}
              <StatsCard
                title="Wake up Calls"
                stats={[
                  {label: 'Called', value: 5},
                  {label: 'Cancelled', value: 3},
                  {label: 'Confirmed', value: 2},
                ]}
                backgroundColor="#fff3e4"
              />
            </View>

            {/* Second Row of Stats Cards */}
            <View style={styles.statsCardsRow}>
              {/* Personal Meeting Card */}
              <StatsCard
                title="Personal Meeting"
                stats={[
                  {label: 'Assigned', value: 5},
                  {label: 'Visited', value: 4},
                  {label: 'Remaining', value: 2},
                ]}
                backgroundColor="#eaffed"
              />

              {/* Zikr Card */}
              <ZikrCounter todayCount={267} totalCount={23000} />
            </View>

            {/* Tasks Progress */}
            <View style={styles.tasksSection}>
              <TaskProgressItem
                title="Fajr Jamath Today"
                current={16}
                total={30}
                color="#B3D964"
              />

              <TaskProgressItem
                title="Quran Thilawath Today"
                current={19}
                total={30}
                color="#64D98A"
              />

              <TaskProgressItem
                title="Isthighfar Today"
                current={16}
                total={30}
                color="#64D98A"
                completed={true}
              />

              <TaskProgressItem
                title="Zikr Today"
                current={16}
                total={30}
                color="#F0964A"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    paddingTop: 20,
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
    ...typography.bodyMedium,
    color: '#333',
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: '#3BACB6',
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
