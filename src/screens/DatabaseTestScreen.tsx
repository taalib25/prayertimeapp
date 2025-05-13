import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  initDatabase,
  savePrayerTimes,
  getPrayerTimes,
  closeDatabase,
  // getPrayerTimesRange, // Example: if you want to test range fetching
} from '../services/db';
import {PrayerTimes} from '../models/PrayerTimes'; // Assuming PrayerTimes model might be defined

// Helper to get current date in YYYY-MM-DD format
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatabaseTestScreen = () => {
  const [log, setLog] = useState<string[]>([]);
  const [fetchedData, setFetchedData] = useState<string>('');

  const addToLog = (message: string) => {
    console.log(message);
    setLog(prevLog => [message, ...prevLog]);
  };

  const handleInitDB = async () => {
    try {
      await initDatabase();
      addToLog('Database initialized successfully.');
    } catch (error) {
      addToLog(`Database initialization failed: ${error}`);
    }
  };

  const handleSaveTestData = async () => {
    const todayStr = getCurrentDateString();
    const testData: PrayerTimes = {
      date: todayStr,
      fajr: '05:00',
      sunrise: '06:30',
      dhuhr: '12:30',
      asr: '15:45',
      maghrib: '18:00',
      isha: '19:30',
    };
    try {
      await savePrayerTimes(todayStr, testData);
      addToLog(`Saved test data for ${todayStr}.`);
    } catch (error) {
      addToLog(`Failed to save test data: ${error}`);
    }
  };

  const handleGetTestData = async () => {
    const todayStr = getCurrentDateString();
    try {
      const data = await getPrayerTimes(todayStr);
      if (data) {
        setFetchedData(JSON.stringify(data, null, 2));
        addToLog(`Fetched data for ${todayStr}.`);
      } else {
        setFetchedData('No data found for today.');
        addToLog(`No data found for ${todayStr}.`);
      }
    } catch (error) {
      addToLog(`Failed to fetch test data: ${error}`);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Database Test</Text>

        <View style={styles.buttonContainer}>
          <Button title="Initialize Database" onPress={handleInitDB} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Save Test Prayer Times (Today)"
            onPress={handleSaveTestData}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Get Prayer Times (Today)"
            onPress={handleGetTestData}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  dataText: {
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
    fontSize: 12,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 2,
  },
});

export default DatabaseTestScreen;
