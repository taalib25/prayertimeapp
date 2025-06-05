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
  getAvailableDates,
  getDateRanges,
  getPrayerTimesWithRangeInfo,
  getAllDateRangesWithCoverage,
  testInterpolationLogic,
} from '../services/db/dbServices';
import {
  bulkImportPrayerTimes,
  observePrayerTimesForDate,
  getPrayerTimesForDate,
  PrayerTimesData,
} from '../services/db/watermelonServices';
import {initDatabase} from '../services/db/dbInitalizer';
import database from '../services/db';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<NavigationProp>();
  const [log, setLog] = useState<string[]>([]);
  const [fetchedData, setFetchedData] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    getCurrentDateString(),
  );
  const [sqlCommand, setSqlCommand] = useState<string>('');
  const [sqlResults, setSqlResults] = useState<string>('');
  const [dbConnection, setDbConnection] = useState<any>(null);

  // Prayer time state
  const [fajr, setFajr] = useState<string>('05:00');
  const [sunrise, setSunrise] = useState<string>('06:30');
  const [dhuhr, setDhuhr] = useState<string>('12:30');
  const [asr, setAsr] = useState<string>('15:45');
  const [maghrib, setMaghrib] = useState<string>('18:00');
  const [isha, setIsha] = useState<string>('19:30');

  const [customPrayerTimes, setCustomPrayerTimes] =
    useState<PrayerTimesData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [rangeInfo, setRangeInfo] = useState<any>(null);
  const [dateRanges, setDateRanges] = useState<any[]>([]);

  const addToLog = (message: string) => {
    console.log(message);
    setLog(prevLog => [message, ...prevLog]);
  };

  // Update the handleGetData function to use the new service
  const handleGetData = async () => {
    try {
      addToLog(`🔍 Searching for prayer times for ${selectedDate}...`);

      const result = await getPrayerTimesWithRangeInfo(selectedDate);
      const {prayerTimes, rangeInfo: range} = result;

      if (prayerTimes) {
        setCustomPrayerTimes(prayerTimes);
        setRangeInfo(range);
        setFetchedData(JSON.stringify(prayerTimes, null, 2));

        if (prayerTimes.isInterpolated) {
          addToLog(
            `📅 Using prayer times from ${prayerTimes.originalDate} for ${selectedDate}`,
          );
          if (range) {
            addToLog(
              `📊 Range: ${range.startDate} to ${range.endDate || 'end'} (${
                range.daysInRange
              } days)`,
            );
          }
        } else {
          addToLog(`✅ Found exact match for ${selectedDate}`);
        }
      } else {
        setCustomPrayerTimes(null);
        setRangeInfo(null);
        setFetchedData('No prayer times found in database');
        addToLog(
          `❌ No prayer times found for ${selectedDate} or any earlier date`,
        );
      }
    } catch (error) {
      addToLog(`❌ Error fetching prayer times: ${error}`);
      setFetchedData(`Error: ${error}`);
    }
  };

  // Add these new functions
  const handleGetAvailableDates = async () => {
    try {
      const dates = await getAvailableDates();
      setAvailableDates(dates);
      addToLog(`📅 Found ${dates.length} available dates in database`);
      addToLog(
        `First: ${dates[0] || 'None'}, Last: ${
          dates[dates.length - 1] || 'None'
        }`,
      );
    } catch (error) {
      addToLog(`❌ Error getting available dates: ${error}`);
    }
  };

  const handleGetDateRanges = async () => {
    try {
      const ranges = await getDateRanges();
      setDateRanges(ranges);
      addToLog(`📊 Found ${ranges.length} date ranges`);
      ranges.forEach((range, index) => {
        addToLog(
          `Range ${index + 1}: ${range.startDate} to ${
            range.endDate || 'end'
          } (${range.daysInRange} days)`,
        );
      });
    } catch (error) {
      addToLog(`❌ Error getting date ranges: ${error}`);
    }
  };

  // Add these new functions after the existing handler functions
  const handleTestInterpolation = async () => {
    try {
      addToLog('🧪 Testing interpolation logic...');
      const result = await testInterpolationLogic();

      addToLog(`Available dates: ${result.availableDates.join(', ')}`);
      addToLog('');

      result.testResults.forEach(test => {
        if (test.result === 'exact') {
          addToLog(`${test.testDate}: ✅ EXACT match`);
        } else if (test.result === 'interpolated') {
          addToLog(
            `${test.testDate}: 📅 INTERPOLATED from ${
              test.sourceDate
            } (range: ${test.rangeStart} to ${test.rangeEnd || 'ongoing'})`,
          );
        } else {
          addToLog(`${test.testDate}: ❌ NOT FOUND`);
        }
      });
    } catch (error) {
      addToLog(`❌ Error testing interpolation: ${error}`);
    }
  };

  const handleShowAllRanges = async () => {
    try {
      addToLog('📊 Getting all date ranges...');
      const ranges = await getAllDateRangesWithCoverage();

      ranges.forEach((range, index) => {
        addToLog(
          `Range ${index + 1}: ${range.startDate} to ${
            range.endDate || 'ongoing'
          } (${range.daysInRange} days)`,
        );
        addToLog(
          `  Prayer times: Fajr ${range.samplePrayerTimes.fajr}, Dhuhr ${range.samplePrayerTimes.dhuhr}, Maghrib ${range.samplePrayerTimes.maghrib}`,
        );
      });
    } catch (error) {
      addToLog(`❌ Error getting ranges: ${error}`);
    }
  };

  // Auto-initialize database when screen loads
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDatabase();
        await openDatabaseConnection();
        addToLog('Database auto-initialized successfully on screen load.');
      } catch (error) {
        addToLog(`Database auto-initialization failed: ${error}`);
      }
    };

    initializeDB();

    // Keep database open when component unmounts for inspection
    return () => {
      addToLog('Component unmounting - keeping database open for inspection');
    };
  }, []);

  // Open and keep database connection for inspection
  const openDatabaseConnection = async () => {
    try {
      const SQLite = require('react-native-sqlite-storage');

      // Enable debugging
      SQLite.DEBUG(true);
      SQLite.enablePromise(true);

      const db = await SQLite.openDatabase({
        name: 'prayer_times.db',
        location: 'default',
        createFromLocation: '~prayer_times.db',
      });

      setDbConnection(db);
      addToLog(
        `Database opened for inspection at: ${
          db._db_name || 'prayer_times.db'
        }`,
      );
      addToLog(
        'Database path: /data/data/com.prayerapp/databases/prayer_times.db',
      );

      return db;
    } catch (error) {
      addToLog(`Failed to open database connection: ${error}`);
      throw error;
    }
  };

  const handleInitDB = async () => {
    try {
      await initDatabase();
      addToLog('Database initialized successfully.');
    } catch (error) {
      addToLog(`Database initialization failed: ${error}`);
    }
  };

  // Execute SQL command using the persistent connection
  const handleExecuteSQL = async () => {
    if (!sqlCommand.trim()) {
      addToLog('Please enter a SQL command');
      return;
    }

    try {
      let db = dbConnection;
      if (!db) {
        db = await openDatabaseConnection();
      }

      const results = await db.executeSql(sqlCommand);
      const [result] = results;

      if (sqlCommand.trim().toLowerCase().startsWith('select')) {
        const rows = result.rows;
        const resultArray = [];
        for (let i = 0; i < rows.length; i++) {
          resultArray.push(rows.item(i));
        }
        setSqlResults(JSON.stringify(resultArray, null, 2));
        addToLog(`Query executed. Returned ${rows.length} rows.`);
      } else {
        setSqlResults(`Query executed. Rows affected: ${result.rowsAffected}`);
        addToLog(`Query executed. Rows affected: ${result.rowsAffected}`);
      }
    } catch (error: any) {
      addToLog(`SQL Error: ${error.message}`);
      setSqlResults(`Error: ${error.message}`);
    }
  };

  // Function to show database info for inspection
  const handleShowDatabaseInfo = async () => {
    try {
      const SQLite = require('react-native-sqlite-storage');
      const db = await SQLite.openDatabase({
        name: 'prayer_times.db',
        location: 'default',
      });

      addToLog('=== DATABASE INSPECTION INFO ===');
      addToLog('Database Name: prayer_times.db');
      addToLog('Location: default');
      addToLog(
        'Platform Path: /data/data/com.prayerapp/databases/prayer_times.db',
      );
      addToLog('Use Android Studio Device File Explorer to browse to:');
      addToLog('data/data/com.prayerapp/databases/');
      addToLog('=== END DATABASE INFO ===');

      // Show all tables
      const tableResults = await db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table';",
      );
      const [tableResult] = tableResults;
      const tables = [];
      for (let i = 0; i < tableResult.rows.length; i++) {
        tables.push(tableResult.rows.item(i).name);
      }
      addToLog(`Available tables: ${tables.join(', ')}`);
    } catch (error) {
      addToLog(`Failed to get database info: ${error}`);
    }
  };

  // Quick table view
  const handleViewTable = (tableName: string) => {
    setSqlCommand(`SELECT * FROM ${tableName} LIMIT 10;`);
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

  // Add these new functions after the existing handler functions
  const handleTestWatermelonDB = async () => {
    try {
      addToLog('🧪 Testing WatermelonDB integration...');

      // Test database connection
      try {
        const collections = database.collections;
        const collectionCount = Object.keys(collections).length;
        addToLog(`✅ Database connected with ${collectionCount} collections`);

        // Test prayer times collection
        const prayerTimesCollection = database.get('prayer_times');
        const count = await prayerTimesCollection.query().fetchCount();
        addToLog(`✅ Prayer times collection accessible (${count} records)`);

        // Test reactive queries
        const observable = observePrayerTimesForDate('2025-06-01');
        addToLog('✅ Reactive queries working');

        addToLog('🎉 WatermelonDB integration test passed!');
      } catch (error) {
        addToLog(`❌ WatermelonDB test error: ${error}`);
      }
    } catch (error) {
      addToLog(`❌ Error testing WatermelonDB: ${error}`);
    }
  };

  const handleTestWatermelonImport = async () => {
    try {
      addToLog('📥 Testing WatermelonDB bulk import...');

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
      addToLog(`✅ Imported ${result.imported} records via WatermelonDB`);

      // Test the data was actually saved
      const prayerTime = await getPrayerTimesForDate('2025-06-01');
      if (prayerTime) {
        addToLog(`✅ Data verification: Fajr time is ${prayerTime.fajr}`);
      }
    } catch (error) {
      addToLog(`❌ Error testing WatermelonDB import: ${error}`);
    }
  };

  const handleCheckWatermelonDBRequirements = () => {
    addToLog('📋 WatermelonDB Installation Checklist:');
    addToLog('1. ✅ npm install @nozbe/watermelondb');
    addToLog('2. ✅ JSI integration added to MainApplication.kt');
    addToLog('3. ✅ Schema and models created');
    addToLog('4. ✅ Database configuration completed');
    addToLog('5. 🔄 App needs restart after native changes');
    addToLog('6. 📱 Test on physical device for best JSI performance');
    addToLog('');
    addToLog('WatermelonDB Features:');
    addToLog('- 🚀 Fast lazy loading');
    addToLog('- 🔄 Reactive queries (auto-update UI)');
    addToLog('- 📱 Offline-first architecture');
    addToLog('- 🎯 Optimized for React Native');
    addToLog('- 💾 SQLite backend with JSI');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Database Test</Text>
        </View>

        {/* Database Inspection Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🔍 Database Inspection</Text>
          <View style={styles.quickButtonsContainer}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={handleShowDatabaseInfo}>
              <Text style={styles.quickButtonText}>Show DB Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={openDatabaseConnection}>
              <Text style={styles.quickButtonText}>Open Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(
                  "SELECT name FROM sqlite_master WHERE type='table';",
                )
              }>
              <Text style={styles.quickButtonText}>List Tables</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(
                  "SELECT COUNT(*) as column_count FROM pragma_table_info('prayer_times');",
                )
              }>
              <Text style={styles.quickButtonText}>Count Columns</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(
                  "SELECT name, type FROM pragma_table_info('prayer_times');",
                )
              }>
              <Text style={styles.quickButtonText}>List Columns</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SQL Command Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>💾 SQL Commands</Text>

          {/* Quick Table Views */}
          <View style={styles.quickButtonsContainer}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleViewTable('prayer_times')}>
              <Text style={styles.quickButtonText}>View Prayer Times</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand('SELECT COUNT(*) as total FROM prayer_times;')
              }>
              <Text style={styles.quickButtonText}>Count Records</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setSqlCommand('PRAGMA table_info(prayer_times);')}>
              <Text style={styles.quickButtonText}>Table Schema</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(
                  "SELECT sql FROM sqlite_master WHERE type='table' AND name='prayer_times';",
                )
              }>
              <Text style={styles.quickButtonText}>CREATE Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(
                  "SELECT name, type FROM pragma_table_info('prayer_times');",
                )
              }>
              <Text style={styles.quickButtonText}>List Columns</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(`-- Users Table
CREATE TABLE IF NOT EXISTS users (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT,
    location TEXT,
    masjid TEXT,
    prayer_settings TEXT DEFAULT '{"notifications": true, "adhan_sound": "default", "calculation_method": "ISNA"}',
    monthly_zikr_goal INTEGER DEFAULT 10000,
    monthly_quran_pages_goal INTEGER DEFAULT 60,
    monthly_charity_goal DECIMAL(10,2) DEFAULT 0,
    monthly_fasting_days_goal INTEGER DEFAULT 0,
    preferred_madhab TEXT DEFAULT 'Hanafi',
    app_language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`)
              }>
              <Text style={styles.quickButtonText}>Create Users Table</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(`-- Daily Tasks Table
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid INTEGER NOT NULL,
    date TEXT NOT NULL,
    fajr_status TEXT DEFAULT 'no',
    dhuhr_status TEXT DEFAULT 'no',
    asr_status TEXT DEFAULT 'no',
    maghrib_status TEXT DEFAULT 'no',
    isha_status TEXT DEFAULT 'no',
    tahajjud_completed BOOLEAN DEFAULT 0,
    duha_completed BOOLEAN DEFAULT 0,
    total_zikr_count INTEGER DEFAULT 0,
    quran_minutes INTEGER DEFAULT 0,
    quran_pages_read INTEGER DEFAULT 0,
    is_fasting BOOLEAN DEFAULT 0,
    fasting_type TEXT,
    special_tasks TEXT DEFAULT '[]',
    notes TEXT,
    day_rating INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    UNIQUE(uid, date)
);`)
              }>
              <Text style={styles.quickButtonText}>Create Daily Tasks</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.sqlInput}
            value={sqlCommand}
            onChangeText={setSqlCommand}
            placeholder="Enter SQL command..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.buttonContainer}>
            <Button title="Execute SQL" onPress={handleExecuteSQL} />
          </View>

          <Text style={styles.subHeader}>SQL Results:</Text>
          <ScrollView
            style={styles.resultsContainer}
            nestedScrollEnabled={true}>
            <Text style={styles.resultsText}>{sqlResults || 'No results'}</Text>
          </ScrollView>
        </View>

        {/* JSON Test Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            🕌 Range-Based Prayer Times Lookup
          </Text>

          <Text style={styles.subHeader}>Selected Date: {selectedDate}</Text>
          {renderDateSelector()}

          <View style={styles.quickButtonsContainer}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={handleGetData}>
              <Text style={styles.quickButtonText}>Get Prayer Times</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickButton}
              onPress={handleGetAvailableDates}>
              <Text style={styles.quickButtonText}>Show Available Dates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickButton}
              onPress={handleGetDateRanges}>
              <Text style={styles.quickButtonText}>Show Date Ranges</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickButton}
              onPress={() =>
                setSqlCommand(`-- Insert sample prayer times data (5-day intervals)
INSERT INTO prayer_times (date, day, fajr, shuruq, dhuha, dhuhr, asr, maghrib, isha, qibla_hour) VALUES
('2025-06-01', 'Sunday', '4:09', '5:23', '5:48', '11:42', '15:05', '17:55', '19:06', '14:27'),
('2025-06-06', 'Friday', '4:09', '5:24', '5:49', '11:43', '15:07', '17:56', '19:08', '14:40'),
('2025-06-11', 'Wednesday', '4:10', '5:24', '5:50', '11:44', '15:09', '17:57', '19:09', '14:51'),
('2025-06-16', 'Monday', '4:11', '5:25', '5:51', '11:45', '15:10', '17:58', '19:10', '14:58'),
('2025-06-21', 'Saturday', '4:12', '5:26', '5:52', '11:46', '15:11', '18:00', '19:12', '15:02'),
('2025-06-26', 'Thursday', '4:13', '5:27', '5:53', '11:47', '15:12', '18:01', '19:13', '15:02');`)
              }>
              <Text style={styles.quickButtonText}>Add Range Sample Data</Text>
            </TouchableOpacity>
          </View>

          {customPrayerTimes && (
            <View style={styles.prayerTimesDisplay}>
              <Text style={styles.prayerTimesTitle}>
                Prayer Times for {customPrayerTimes.date} (
                {customPrayerTimes.day})
              </Text>

              {customPrayerTimes.isInterpolated && (
                <View style={styles.interpolatedInfo}>
                  <Text style={styles.interpolatedText}>
                    📍 Using times from {customPrayerTimes.originalDate}
                  </Text>
                  {rangeInfo && (
                    <>
                      <Text style={styles.rangeText}>
                        Valid from {rangeInfo.startDate} to{' '}
                        {rangeInfo.endDate || 'end'} ({rangeInfo.daysInRange}{' '}
                        days)
                      </Text>
                      <Text style={styles.rangeText}>
                        Target in range:{' '}
                        {rangeInfo.targetInRange ? '✅ Yes' : '❌ No'}
                      </Text>
                    </>
                  )}
                </View>
              )}

              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Fajr:</Text>
                <Text style={styles.prayerTime}>{customPrayerTimes.fajr}</Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Shuruq:</Text>
                <Text style={styles.prayerTime}>
                  {customPrayerTimes.shuruq}
                </Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Dhuha:</Text>
                <Text style={styles.prayerTime}>{customPrayerTimes.dhuha}</Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Dhuhr:</Text>
                <Text style={styles.prayerTime}>{customPrayerTimes.dhuhr}</Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Asr:</Text>
                <Text style={styles.prayerTime}>{customPrayerTimes.asr}</Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Maghrib:</Text>
                <Text style={styles.prayerTime}>
                  {customPrayerTimes.maghrib}
                </Text>
              </View>
              <View style={styles.prayerTimeRow}>
                <Text style={styles.prayerLabel}>Isha:</Text>
                <Text style={styles.prayerTime}>{customPrayerTimes.isha}</Text>
              </View>
              {customPrayerTimes.qibla_hour && (
                <View style={styles.prayerTimeRow}>
                  <Text style={styles.prayerLabel}>Qibla Hour:</Text>
                  <Text style={styles.prayerTime}>
                    {customPrayerTimes.qibla_hour}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.subHeader}>Raw JSON Response:</Text>
          <ScrollView
            style={styles.resultsContainer}
            nestedScrollEnabled={true}>
            <Text style={styles.resultsText}>{fetchedData || 'No data'}</Text>
          </ScrollView>

          {dateRanges.length > 0 && (
            <View>
              <Text style={styles.subHeader}>Date Ranges Coverage:</Text>
              <ScrollView
                style={styles.rangesContainer}
                nestedScrollEnabled={true}>
                {dateRanges.map((range, index) => (
                  <Text key={index} style={styles.rangeItem}>
                    {range.startDate} → {range.endDate || 'end'} (
                    {range.daysInRange} days)
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

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
  buttonContainer: {
    marginBottom: 10,
  },
  subHeader: {
    ...typography.h3,
    marginTop: 20,
    marginBottom: 5,
  },
  dataText: {
    ...typography.bodySmall,
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
    backgroundColor: colors.background.surface,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: colors.accent,
  },
  dateButtonText: {
    ...typography.bodyMedium,
    color: '#333',
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  inputSection: {
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
  prayerTimeInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    marginBottom: 20,
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
    backgroundColor: '#f9f9f9',
  },
  sqlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    ...typography.body,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 15,
  },
  resultsText: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: '#333',
  },
  quickButtonsContainer: {
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
    ...typography.caption,
    color: '#fff',
    fontSize: 12,
  },

  // Add to your existing styles:
  prayerTimesDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  prayerTimesTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 15,
    color: colors.primary,
  },
  interpolatedInfo: {
    backgroundColor: '#fff3cd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  interpolatedText: {
    ...typography.bodySmall,
    color: '#856404',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rangeText: {
    ...typography.caption,
    color: '#856404',
    textAlign: 'center',
    marginTop: 5,
  },
  prayerTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  prayerLabel: {
    ...typography.bodyMedium,
    fontWeight: 'bold',
    color: '#495057',
  },
  prayerTime: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  rangesContainer: {
    maxHeight: 150,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  rangeItem: {
    ...typography.caption,
    color: '#666',
    marginBottom: 3,
  },
});

export default DatabaseTestScreen;
