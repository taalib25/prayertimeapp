import React, {useState, useEffect} from 'react';
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
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {
  getPrayerTimesForDate,
  bulkImportPrayerTimes,
  PrayerTimesData,
  getAvailableDates,
} from '../services/db/watermelonServices';
import database from '../services/db';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DatabaseTestScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [log, setLog] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2025-06-01');
  const [customPrayerTimes, setCustomPrayerTimes] =
    useState<PrayerTimesData | null>(null);

  const addToLog = (message: string) => {
    console.log(message);
    setLog(prevLog => [message, ...prevLog]);
  };

  // Test WatermelonDB basic functionality
  const handleTestWatermelonDB = async () => {
    try {
      addToLog('🧪 Testing WatermelonDB...');

      // Test database connection
      const collections = database.collections;
      const collectionCount = Object.keys(collections).length;
      addToLog(`✅ Database connected with ${collectionCount} collections`);

      // Test prayer times collection
      const prayerTimesCollection = database.get('prayer_times');
      const count = await prayerTimesCollection.query().fetchCount();
      addToLog(`✅ Prayer times collection: ${count} records`);

      addToLog('🎉 WatermelonDB test passed!');
    } catch (error) {
      addToLog(`❌ WatermelonDB error: ${error}`);
    }
  };

  // Test data import
  const handleTestImport = async () => {
    try {
      addToLog('📥 Testing data import...');

      const sampleData = [
        {
          date: '2025-06-01',
          day: 'Sunday',
          fajr: '4:09',
          shuruq: '5:23',
          dhuha: '5:48',
          dhuhr: '11:42',
          asr: '15:05',
          maghrib: '17:55',
          isha: '19:06',
          qibla_hour: '14:27',
        },
        {
          date: '2025-06-06',
          day: 'Friday',
          fajr: '4:09',
          shuruq: '5:24',
          dhuha: '5:49',
          dhuhr: '11:43',
          asr: '15:07',
          maghrib: '17:56',
          isha: '19:08',
          qibla_hour: '14:40',
        },
      ];

      const result = await bulkImportPrayerTimes(sampleData);
      addToLog(`✅ Imported ${result.imported} records`);
    } catch (error) {
      addToLog(`❌ Import error: ${error}`);
    }
  };

  // Test data retrieval
  const handleTestRetrieve = async () => {
    try {
      addToLog(`🔍 Getting prayer times for ${selectedDate}...`);

      const prayerTime = await getPrayerTimesForDate(selectedDate);
      if (prayerTime) {
        setCustomPrayerTimes(prayerTime);
        addToLog(`✅ Found prayer times: Fajr ${prayerTime.fajr}`);
      } else {
        addToLog(`❌ No prayer times found for ${selectedDate}`);
        setCustomPrayerTimes(null);
      }
    } catch (error) {
      addToLog(`❌ Retrieve error: ${error}`);
    }
  };

  // Test getting all available dates
  const handleGetAvailableDates = async () => {
    try {
      addToLog('📅 Getting all available dates...');
      const dates = await getAvailableDates();
      addToLog(`✅ Found ${dates.length} available dates`);
      if (dates.length > 0) {
        addToLog(`First: ${dates[0]}, Last: ${dates[dates.length - 1]}`);
      }
    } catch (error) {
      addToLog(`❌ Error getting dates: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Database Test</Text>
        </View>

        {/* WatermelonDB Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍉 WatermelonDB Tests</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestWatermelonDB}>
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestImport}>
              <Text style={styles.buttonText}>Import Sample Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleGetAvailableDates}>
              <Text style={styles.buttonText}>Get Available Dates</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
            />
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestRetrieve}>
              <Text style={styles.buttonText}>Get Prayer Times</Text>
            </TouchableOpacity>
          </View>

          {/* Prayer Times Display */}
          {customPrayerTimes && (
            <View style={styles.prayerTimesDisplay}>
              <Text style={styles.prayerTitle}>
                {customPrayerTimes.date} - {customPrayerTimes.day}
                {customPrayerTimes.isInterpolated && ' (Interpolated)'}
              </Text>
              <Text style={styles.prayerText}>
                Fajr: {customPrayerTimes.fajr}
              </Text>
              <Text style={styles.prayerText}>
                Dhuhr: {customPrayerTimes.dhuhr}
              </Text>
              <Text style={styles.prayerText}>
                Asr: {customPrayerTimes.asr}
              </Text>
              <Text style={styles.prayerText}>
                Maghrib: {customPrayerTimes.maghrib}
              </Text>
              <Text style={styles.prayerText}>
                Isha: {customPrayerTimes.isha}
              </Text>
              {customPrayerTimes.originalDate && (
                <Text style={styles.interpolatedText}>
                  Source: {customPrayerTimes.originalDate}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Logs</Text>
          <ScrollView style={styles.logContainer}>
            {log.map((item, index) => (
              <Text key={index} style={styles.logItem}>
                {item}
              </Text>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  container: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  title: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 120,
  },
  prayerTimesDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  prayerText: {
    fontSize: 14,
    marginBottom: 5,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  quickButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  sqlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginTop: 15,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logItem: {
    fontSize: 12,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  interpolatedText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default DatabaseTestScreen;
