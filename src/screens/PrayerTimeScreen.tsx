import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Button,
  Platform,
} from 'react-native';
import PermissionButton from '../components/permissionBtn';
import {PermissionType} from '../services/permissions/initPermissions';
import {initDatabase, getPrayerTimes} from '../services/db';
import {PrayerTimes as PrayerTimesFromDB} from '../models/PrayerTimes';
import DateSelector from '../components/DateSelector';

import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App'; // Adjust path as necessary

// Helper to get current date in YYYY-MM-DD format
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format "HH:MM" (24-hour) to "hh:mm AM/PM"
const formatTo12Hour = (time24: string | undefined): string => {
  if (!time24) return 'N/A';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h || 12; // Convert 0 to 12
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

interface PrayerTimeDisplayItem {
  id: string;
  name: string;
  time: string;
  isNext: boolean;
}

const PRAYER_DEFINITIONS = [
  {key: 'fajr', displayName: 'Fajr'},
  {key: 'dhuhr', displayName: 'Dhuhr'},
  {key: 'asr', displayName: 'Asr'},
  {key: 'maghrib', displayName: 'Maghrib'},
  {key: 'isha', displayName: 'Isha'},
];

interface PrayerItemProps {
  name: string;
  time: string;
  isNext?: boolean;
}

const PrayerItem: React.FC<PrayerItemProps> = ({name, time, isNext}) => (
  <View
    style={[
      styles.prayerItemContainer,
      isNext && styles.nextPrayerItemContainer,
    ]}>
    <Text style={[styles.prayerName, isNext && styles.nextPrayerText]}>
      {name}
    </Text>
    <Text style={[styles.prayerTime, isNext && styles.nextPrayerText]}>
      {time}
    </Text>
  </View>
);

type PrayerTimeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainApp' // Current screen's name in the stack
>;

const PrayerTimeScreen = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<PrayerTimeScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database when component mounts
  useEffect(() => {
    const initDb = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(
          `Database initialization failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    };

    initDb();
  }, []);

  // Load prayer times when database is initialized or selected date changes
  useEffect(() => {
    if (dbInitialized) {
      loadPrayerTimes(selectedDate);
    }
  }, [dbInitialized, selectedDate]);

  const loadPrayerTimes = async (dateStr: string = selectedDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const dbData = (await getPrayerTimes(
        dateStr,
      )) as PrayerTimesFromDB | null;

      if (dbData) {
        const now = new Date();
        let nextPrayerFound = false;

        // Only show next prayer indicator for today's date
        const isToday = dateStr === getCurrentDateString();

        const processedTimes = PRAYER_DEFINITIONS.map((prayerDef, index) => {
          const prayerTime24 = dbData[
            prayerDef.key as keyof PrayerTimesFromDB
          ] as string | undefined;

          let isThisNext = false;
          if (prayerTime24 && !nextPrayerFound && isToday) {
            const [hours, minutes] = prayerTime24.split(':').map(Number);
            const prayerDateTime = new Date(now); // Use current date
            prayerDateTime.setHours(hours, minutes, 0, 0);

            if (prayerDateTime > now) {
              isThisNext = true;
              nextPrayerFound = true;
            }
          }

          return {
            id: String(index + 1),
            name: prayerDef.displayName,
            time: formatTo12Hour(prayerTime24),
            isNext: isThisNext,
          };
        });
        setPrayerTimes(processedTimes);
      } else {
        setError(
          `No prayer times found for ${dateStr}. Please add them using the Database Test Screen or ensure your data source is configured.`,
        );
        setPrayerTimes([]);
      }
    } catch (err) {
      console.error('Failed to fetch prayer times:', err);
      setError(
        `Failed to load prayer times: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      setPrayerTimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Prayer Times</Text>{' '}
        <View style={styles.dateSelector}>
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </View>
        <View style={{marginVertical: 10}}>
          <Button
            title="Go to Database Test"
            onPress={() => navigation.navigate('DatabaseTest')}
          />
          <Button
            title="Go to Call Screen"
            onPress={() => navigation.navigate('CallScreen')}
          />
        </View>
        <View style={{marginVertical: 10}}>
          <Button
            title="Refresh Times"
            onPress={() => loadPrayerTimes(selectedDate)}
          />
        </View>
        <View style={{marginBottom: 20}}>
          <PermissionButton
            permissionType={PermissionType.LOCATION}
            buttonText="Allow Location Access"
            onPermissionGranted={() => console.log('Location granted!')}
          />

          {Platform.OS === 'android' && (
            <>
              <PermissionButton
                permissionType={PermissionType.SYSTEM_ALERT_WINDOW}
                buttonText="Allow System Alert Window"
                onPermissionGranted={() =>
                  console.log('System Alert Window granted!')
                }
              />

              <PermissionButton
                permissionType={PermissionType.DND_ACCESS}
                buttonText="Allow Do Not Disturb Access"
                onPermissionGranted={() => console.log('DND Access granted!')}
              />
            </>
          )}
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#1a5276" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : prayerTimes.length === 0 && !error ? (
          <Text style={styles.infoText}>
            No prayer times available for today.
          </Text>
        ) : (
          <FlatList
            data={prayerTimes}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <PrayerItem
                name={item.name}
                time={item.time}
                isNext={item.isNext}
              />
            )}
            contentContainerStyle={styles.listContentContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f3', // Lighter background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 30, // Increased margin
    textAlign: 'center',
    color: '#1a5276', // Darker blue
  },
  dateSelector: {
    marginBottom: 15,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  prayerItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20, // Increased padding
    paddingHorizontal: 20, // Increased padding
    backgroundColor: '#ffffff',
    borderRadius: 12, // Smoother radius
    marginBottom: 15, // Increased margin
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3, // Slightly more shadow
    },
    shadowOpacity: 0.15, // Slightly more shadow
    shadowRadius: 4.65,
    elevation: 6,
  },
  nextPrayerItemContainer: {
    backgroundColor: '#1abc9c', // Teal for next prayer
    borderColor: '#16a085', // Darker teal border
    borderWidth: 1, // Add a border for emphasis
  },
  prayerName: {
    fontSize: 20, // Larger name
    fontWeight: 'bold', // Bolder name
    color: '#2c3e50', // Dark grey
  },
  prayerTime: {
    fontSize: 18, // Keep consistent with name or slightly smaller
    fontWeight: 'bold', // Bolder time
    color: '#2980b9', // Blue for time
  },
  nextPrayerText: {
    color: '#ffffff', // White text for next prayer
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginVertical: 20,
  },
  infoText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    marginVertical: 20,
  },
});

export default PrayerTimeScreen;
