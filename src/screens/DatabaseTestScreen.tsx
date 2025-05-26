import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {savePrayerTimes, getPrayerTimes, closeDatabase} from '../services/db';
import {PrayerTimes} from '../models/PrayerTimes';
import {typography} from '../utils/typography';

// Helper to get current date in YYYY-MM-DD format
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Function to add days to a date
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatabaseTestScreen = () => {
  const [log, setLog] = useState<string[]>([]);
  const [fetchedData, setFetchedData] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    getCurrentDateString(),
  );

  // Prayer time state
  const [fajr, setFajr] = useState<string>('05:00');
  const [sunrise, setSunrise] = useState<string>('06:30');
  const [dhuhr, setDhuhr] = useState<string>('12:30');
  const [asr, setAsr] = useState<string>('15:45');
  const [maghrib, setMaghrib] = useState<string>('18:00');
  const [isha, setIsha] = useState<string>('19:30');

  const addToLog = (message: string) => {
    console.log(message);
    setLog(prevLog => [message, ...prevLog]);
  };

  const handleSaveData = async () => {
    const prayerData: PrayerTimes = {
      date: selectedDate,
      fajr: fajr,
      sunrise: sunrise,
      dhuhr: dhuhr,
      asr: asr,
      maghrib: maghrib,
      isha: isha,
    };
    try {
      await savePrayerTimes(selectedDate, prayerData);
      addToLog(`Saved prayer times for ${selectedDate}`);
    } catch (error) {
      addToLog(`Failed to save prayer data: ${error}`);
    }
  };

  const handleGetData = async () => {
    try {
      const data = await getPrayerTimes(selectedDate);
      if (data) {
        setFetchedData(JSON.stringify(data, null, 2));
        addToLog(`Fetched data for ${selectedDate}`);

        // Update input fields with fetched data
        setFajr(data.fajr || '05:00');
        setSunrise(data.sunrise || '06:30');
        setDhuhr(data.dhuhr || '12:30');
        setAsr(data.asr || '15:45');
        setMaghrib(data.maghrib || '18:00');
        setIsha(data.isha || '19:30');
      } else {
        setFetchedData('No data found for selected date');
        addToLog(`No data found for ${selectedDate}`);
      }
    } catch (error) {
      addToLog(`Failed to fetch data: ${error}`);
    }
  };

  const handleCloseDB = async () => {
    try {
      await closeDatabase();
      addToLog('Database closed successfully.');
    } catch (error) {
      addToLog(`Database close failed: ${error}`);
    }
  };

  // Add prayer times for multiple days
  const handleAddMultipleDays = async () => {
    try {
      for (let i = 0; i < 7; i++) {
        const date = addDays(getCurrentDateString(), i);
        // Slightly vary prayer times for each day
        const prayerData: PrayerTimes = {
          date: date,
          fajr: adjustTime(fajr, i),
          sunrise: adjustTime(sunrise, i),
          dhuhr: adjustTime(dhuhr, i),
          asr: adjustTime(asr, i),
          maghrib: adjustTime(maghrib, i),
          isha: adjustTime(isha, i),
        };
        await savePrayerTimes(date, prayerData);
      }
      addToLog('Added prayer times for the next 7 days');
    } catch (error) {
      addToLog(`Failed to add multiple days: ${error}`);
    }
  };

  // Helper to adjust time slightly for demo purposes
  const adjustTime = (time: string, dayOffset: number): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const minuteAdjust = dayOffset * 2; // 2 minutes later each day

    const date = new Date();
    date.setHours(hours, minutes + minuteAdjust, 0, 0);

    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // Date selector buttons
  const renderDateSelector = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const date = addDays(getCurrentDateString(), i);
      const isToday = i === 0;
      dates.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dateButton,
            selectedDate === date && styles.selectedDateButton,
          ]}
          onPress={() => setSelectedDate(date)}>
          <Text
            style={[
              styles.dateButtonText,
              selectedDate === date && styles.selectedDateButtonText,
            ]}>
            {isToday ? 'Today' : date.split('-')[2]}
          </Text>
        </TouchableOpacity>,
      );
    }
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}>
        {dates}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Database Test</Text>

        <Text style={styles.subHeader}>Selected Date: {selectedDate}</Text>
        {renderDateSelector()}

        <View style={styles.prayerTimeInputContainer}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Fajr:</Text>
            <TextInput
              style={styles.timeInput}
              value={fajr}
              onChangeText={setFajr}
              placeholder="05:00"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Sunrise:</Text>
            <TextInput
              style={styles.timeInput}
              value={sunrise}
              onChangeText={setSunrise}
              placeholder="06:30"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Dhuhr:</Text>
            <TextInput
              style={styles.timeInput}
              value={dhuhr}
              onChangeText={setDhuhr}
              placeholder="12:30"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Asr:</Text>
            <TextInput
              style={styles.timeInput}
              value={asr}
              onChangeText={setAsr}
              placeholder="15:45"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Maghrib:</Text>
            <TextInput
              style={styles.timeInput}
              value={maghrib}
              onChangeText={setMaghrib}
              placeholder="18:00"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Isha:</Text>
            <TextInput
              style={styles.timeInput}
              value={isha}
              onChangeText={setIsha}
              placeholder="19:30"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Save Prayer Times" onPress={handleSaveData} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Get Prayer Times" onPress={handleGetData} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Add Prayer Times for Next 7 Days"
            onPress={handleAddMultipleDays}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Close Database" onPress={handleCloseDB} />
        </View>

        <Text style={styles.subHeader}>Fetched Data:</Text>
        <Text style={styles.dataText}>{fetchedData || 'None'}</Text>

        <Text style={styles.subHeader}>Logs:</Text>
        <ScrollView style={styles.logContainer} nestedScrollEnabled={true}>
          {log.map((item, index) => (
            <Text key={index} style={styles.logItem}>
              {item}
            </Text>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    padding: 20,
  },
  title: {
    ...typography.h2,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  subHeader: {
    ...typography.h3,
    marginTop: 20,
    marginBottom: 5,
  },
  dataText: {
    ...typography.body,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    minHeight: 50,
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logItem: {
    ...typography.caption,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  dateButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#1abc9c',
  },
  dateButtonText: {
    ...typography.bodyMedium,
    color: '#333',
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  prayerTimeInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    ...typography.bodyMedium,
    width: 70,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    ...typography.body,
  },
});

export default DatabaseTestScreen;
