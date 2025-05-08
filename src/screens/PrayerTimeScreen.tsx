import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, SafeAreaView} from 'react-native';

const initialPrayerTimesData = [
  {id: '1', name: 'Fajr', time: '05:00 AM', isNext: false},
  {id: '2', name: 'Dhuhr', time: '01:00 PM', isNext: false},
  {id: '3', name: 'Asr', time: '04:30 PM', isNext: true}, // Example: Asr is the next prayer
  {id: '4', name: 'Maghrib', time: '07:00 PM', isNext: false},
  {id: '5', name: 'Isha', time: '08:30 PM', isNext: false},
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

const PrayerTimeScreen = () => {
  const [prayerTimes, setPrayerTimes] = useState(initialPrayerTimesData);

  useEffect(() => {
    // TODO: Fetch prayer times from SQL database and update state
    // Example:
    // const fetchPrayers = async () => {
    //   try {
    //     // const dataFromDb = await yourDbQueryFunction();
    //     // const processedData = dataFromDb.map(item => ({...item, isNext: determineIfNext(item.time)}));
    //     // setPrayerTimes(processedData);
    //   } catch (error) {
    //     console.error("Failed to fetch prayer times:", error);
    //   }
    // };
    // fetchPrayers();

    // For now, we can simulate determining the next prayer if not hardcoded
    // This logic would ideally be more robust, considering current time
    const currentTime = new Date();
    // Placeholder: find the first prayer time after current time or mark one manually as in initialPrayerTimesData
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Prayer Times</Text>
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
    borderColor: '#16a085',
    borderWidth: 1,
  },
  prayerName: {
    fontSize: 20, // Larger name
    fontWeight: 'bold', // Bolder name
    color: '#2c3e50', // Dark grey
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: 'bold', // Bolder time
    color: '#2980b9', // Blue for time
  },
  nextPrayerText: {
    color: '#ffffff', // White text for next prayer
  },
});

export default PrayerTimeScreen;
