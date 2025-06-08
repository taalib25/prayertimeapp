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
  import2025PrayerTimes,
} from '../services/db/PrayerServices';
import {
  getDailyTasksForDate,
  updateSpecialTaskStatus,
  createDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import {useHistoricalTasks} from '../hooks/useHistoricalTasks';
import {useDailyTasks} from '../hooks/useDailyTasks';
import database from '../services/db';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DatabaseTestScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [log, setLog] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2025-06-01');
  const [startDate, setStartDate] = useState<string>('2025-01-13');
  const [endDate, setEndDate] = useState<string>('2025-01-15');
  const [testUserId, setTestUserId] = useState<number>(1001);
  const [customPrayerTimes, setCustomPrayerTimes] =
    useState<PrayerTimesData | null>(null);
  const [dailyTasksData, setDailyTasksData] = useState<DailyTaskData[]>([]);

  // Historical tasks hook for analysis
  const {
    data: historicalData,
    analysis,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useHistoricalTasks({
    uid: testUserId,
    config: {
      daysBack: 3,
      includePrayers: true,
      includeSpecialTasks: true,
      includeZikr: true,
      calculateTotals: true,
      calculateAverages: true,
      calculateStreaks: true,
    },
  });

  // Daily tasks hook for today
  const {
    dailyTasks: todayTasks,
    isLoading: todayLoading,
    toggleSpecialTask,
    refetch: refetchToday,
  } = useDailyTasks({
    uid: testUserId,
    date: new Date().toISOString().split('T')[0],
  });

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

  // Import complete 2025 prayer times
  const handleImport2025Data = async () => {
    try {
      addToLog('📥 Importing complete 2025 prayer times...');
      const result = await import2025PrayerTimes();
      addToLog(`✅ Successfully imported ${result.imported} records for 2025`);
    } catch (error) {
      addToLog(`❌ Error importing 2025 data: ${error}`);
    }
  };

  // Test data retrieval
  const handleTestRetrieve = async () => {
    try {
      addToLog(`🔍 Getting prayer times for ${selectedDate}...`);

      const prayerTime = await getPrayerTimesForDate(selectedDate);

      if (prayerTime) {
        setCustomPrayerTimes(prayerTime);
        addToLog(`✅ Found prayer times: Fajr ${prayerTime.shuruq}`);
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

  // Test daily tasks database functionality
  const handleTestDailyTasksDB = async () => {
    try {
      addToLog('🧪 Testing Daily Tasks Database...');

      // Test database connection
      const dailyTasksCollection = database.get('daily_tasks');
      const count = await dailyTasksCollection.query().fetchCount();
      addToLog(`✅ Daily tasks collection: ${count} records`);

      addToLog('🎉 Daily Tasks DB test passed!');
    } catch (error) {
      addToLog(`❌ Daily Tasks DB error: ${error}`);
    }
  };

  // Create dummy daily tasks for testing
  const handleCreateDummyTasks = async () => {
    try {
      addToLog('📝 Creating dummy daily tasks for past 3 days...');

      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      for (const date of dates) {
        await createDailyTasks(testUserId, date);
        addToLog(`✅ Created tasks for ${date}`);
      }

      addToLog('🎉 Dummy tasks created successfully!');
    } catch (error) {
      addToLog(`❌ Error creating dummy tasks: ${error}`);
    }
  };

  // Get daily tasks for a specific date
  const handleGetDailyTasks = async () => {
    try {
      addToLog(`🔍 Getting daily tasks for ${selectedDate}...`);

      const tasks = await getDailyTasksForDate(testUserId, selectedDate);

      if (tasks) {
        addToLog(`✅ Found tasks for ${selectedDate}:`);
        addToLog(`   Special tasks: ${tasks.specialTasks.length}`);
        addToLog(`   Zikr count: ${tasks.totalZikrCount}`);
        addToLog(
          `   Prayers: F:${tasks.fajrStatus} D:${tasks.dhuhrStatus} A:${tasks.asrStatus} M:${tasks.maghribStatus} I:${tasks.ishaStatus}`,
        );

        setDailyTasksData([tasks]);
      } else {
        addToLog(`❌ No tasks found for ${selectedDate}`);
        setDailyTasksData([]);
      }
    } catch (error) {
      addToLog(`❌ Error getting daily tasks: ${error}`);
    }
  };

  // Get tasks for date range
  const handleGetTasksRange = async () => {
    try {
      addToLog(`🔍 Getting tasks from ${startDate} to ${endDate}...`);

      const tasks: DailyTaskData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      while (start <= end) {
        const dateStr = start.toISOString().split('T')[0];
        const dayTasks = await getDailyTasksForDate(testUserId, dateStr);
        if (dayTasks) {
          tasks.push(dayTasks);
        }
        start.setDate(start.getDate() + 1);
      }

      addToLog(`✅ Found ${tasks.length} days with tasks`);
      setDailyTasksData(tasks);

      // Calculate summary
      const totalSpecialTasks = tasks.reduce(
        (sum, day) => sum + day.specialTasks.length,
        0,
      );
      const completedSpecialTasks = tasks.reduce(
        (sum, day) =>
          sum + day.specialTasks.filter(task => task.completed).length,
        0,
      );
      const totalZikr = tasks.reduce((sum, day) => sum + day.totalZikrCount, 0);

      addToLog(
        `📊 Summary: ${completedSpecialTasks}/${totalSpecialTasks} special tasks completed, ${totalZikr} total zikr`,
      );
    } catch (error) {
      addToLog(`❌ Error getting tasks range: ${error}`);
    }
  };

  // Test special task toggle
  const handleTestSpecialTaskToggle = async () => {
    try {
      addToLog('🔄 Testing special task toggle...');

      // Get today's tasks first
      const today = new Date().toISOString().split('T')[0];
      const tasks = await getDailyTasksForDate(testUserId, today);

      if (tasks && tasks.specialTasks.length > 0) {
        const firstTask = tasks.specialTasks[0];
        const newStatus = !firstTask.completed;

        await updateSpecialTaskStatus(
          testUserId,
          today,
          firstTask.id,
          newStatus,
        );
        addToLog(
          `✅ Toggled task "${firstTask.title}" to ${
            newStatus ? 'completed' : 'pending'
          }`,
        );

        // Refresh data
        await refetchToday();
      } else {
        addToLog('❌ No special tasks found for today');
      }
    } catch (error) {
      addToLog(`❌ Error toggling special task: ${error}`);
    }
  };

  // Show historical analysis
  const handleShowHistoricalAnalysis = () => {
    try {
      addToLog('📊 Historical Analysis (Last 3 Days):');

      if (analysis) {
        addToLog(`   Total Days: ${analysis.totalDays}`);
        addToLog(`   Total Special Tasks: ${analysis.totalSpecialTasks}`);
        addToLog(
          `   Completed Special Tasks: ${analysis.totalSpecialTasksCompleted}`,
        );
        addToLog(
          `   Average Tasks/Day: ${analysis.avgSpecialTasksPerDay.toFixed(1)}`,
        );
        addToLog(`   Average Zikr/Day: ${analysis.avgZikrPerDay.toFixed(0)}`);
        addToLog(
          `   Current Task Streak: ${analysis.currentSpecialTaskStreak}`,
        );
        addToLog(
          `   Longest Task Streak: ${analysis.longestSpecialTaskStreak}`,
        );

        // Show per-task breakdown
        Object.entries(analysis.specialTaskStats).forEach(([taskId, stats]) => {
          addToLog(
            `   "${stats.title}": ${stats.completed}/${
              stats.total
            } (${stats.percentage.toFixed(0)}%)`,
          );
        });
      } else {
        addToLog('❌ No analysis data available');
      }
    } catch (error) {
      addToLog(`❌ Error showing analysis: ${error}`);
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

        {/* User ID Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Test Configuration</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>User ID:</Text>
            <TextInput
              style={styles.numberInput}
              value={testUserId.toString()}
              onChangeText={text => setTestUserId(parseInt(text) || 1001)}
              placeholder="1001"
              keyboardType="numeric"
            />
          </View>
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
              onPress={handleImport2025Data}>
              <Text style={styles.buttonText}>Import 2025 Data</Text>
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

        {/* Daily Tasks Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Daily Tasks Tests</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestDailyTasksDB}>
              <Text style={styles.buttonText}>Test DB Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleCreateDummyTasks}>
              <Text style={styles.buttonText}>Create Dummy Tasks</Text>
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
              onPress={handleGetDailyTasks}>
              <Text style={styles.buttonText}>Get Single Day</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="Start Date"
            />
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="End Date"
            />
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleGetTasksRange}>
              <Text style={styles.buttonText}>Get Range</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestSpecialTaskToggle}>
              <Text style={styles.buttonText}>Toggle Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleShowHistoricalAnalysis}>
              <Text style={styles.buttonText}>Show Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Data Display */}
        {dailyTasksData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Task Data</Text>
            <ScrollView style={styles.dataContainer}>
              {dailyTasksData.map((dayData, index) => (
                <View key={dayData.date} style={styles.dayDataContainer}>
                  <Text style={styles.dayTitle}>{dayData.date}</Text>
                  <Text style={styles.dataText}>
                    Zikr: {dayData.totalZikrCount}
                  </Text>
                  <Text style={styles.dataText}>
                    Quran: {dayData.quranPagesRead} pages
                  </Text>
                  <Text style={styles.dataText}>
                    Special Tasks ({dayData.specialTasks.length}):
                  </Text>
                  {dayData.specialTasks.map(task => (
                    <Text
                      key={task.id}
                      style={[
                        styles.taskText,
                        task.completed && styles.completedTask,
                      ]}>
                      • {task.title} {task.completed ? '✅' : '❌'}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginRight: 10,
    minWidth: 60,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minWidth: 80,
    textAlign: 'center',
  },
  dataContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  dayDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  taskText: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 2,
    color: '#666',
  },
  completedTask: {
    color: colors.success,
  },
});

export default DatabaseTestScreen;
