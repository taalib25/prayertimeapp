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
  getRecentDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import {useDailyTasks} from '../hooks/useDailyTasks';
import database from '../services/db';
import {
  getUserById,
  createUser,
  updateUserGoals,
  updateUserSettings,
  updateUserProfile,
} from '../services/db/UserServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [asyncStorageData, setAsyncStorageData] = useState<any>({});
  const [editingGoals, setEditingGoals] = useState({
    monthlyZikrGoal: '',
    monthlyQuranPagesGoal: '',
    monthlyCharityGoal: '',
    monthlyFastingDaysGoal: '',
  });
  const [editingSettings, setEditingSettings] = useState({
    theme: '',
    appLanguage: '',
    preferredMadhab: '',
    location: '',
    masjid: '',
  });
  const [selectedTaskDate, setSelectedTaskDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [taskDaysToCreate, setTaskDaysToCreate] = useState<number>(3);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [currentDayTasks, setCurrentDayTasks] = useState<DailyTaskData | null>(
    null,
  );

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

  // Get tasks for the selected date
  const handleGetTasksForSelectedDate = async () => {
    try {
      addToLog(`🔍 Getting daily tasks for ${selectedTaskDate}...`);

      const tasks = await getDailyTasksForDate(testUserId, selectedTaskDate);

      if (tasks) {
        setCurrentDayTasks(tasks);
        addToLog(`✅ Found tasks for ${selectedTaskDate}:`);
        addToLog(`   Special tasks: ${tasks.specialTasks.length}`);
        addToLog(`   Zikr count: ${tasks.totalZikrCount}`);
        addToLog(`   Quran pages: ${tasks.quranPagesRead}`);
        addToLog(
          `   Prayers: F:${tasks.fajrStatus} D:${tasks.dhuhrStatus} A:${tasks.asrStatus} M:${tasks.maghribStatus} I:${tasks.ishaStatus}`,
        );
      } else {
        addToLog(`❌ No tasks found for ${selectedTaskDate}`);
        setCurrentDayTasks(null);
      }
    } catch (error) {
      addToLog(`❌ Error getting daily tasks: ${error}`);
    }
  };

  // Get tasks for date range
  const handleGetTasksRange = async () => {
    try {
      addToLog(`📅 Getting tasks from ${startDate} to ${endDate}...`);

      const dates = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Generate array of dates between start and end
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      for (const date of dates) {
        const tasks = await getDailyTasksForDate(testUserId, date);
        if (tasks) {
          addToLog(
            `✅ Found tasks for ${date}: ${tasks.specialTasks.length} special tasks`,
          );
        } else {
          addToLog(`❌ No tasks found for ${date}`);
        }
      }
    } catch (error) {
      addToLog(`❌ Error getting tasks range: ${error}`);
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

  // Enhanced create dummy tasks with date selection
  const handleCreateDummyTasksForDays = async () => {
    try {
      addToLog(
        `📝 Creating dummy daily tasks for ${taskDaysToCreate} days starting from ${selectedTaskDate}...`,
      );

      const dates = [];
      const startDate = new Date(selectedTaskDate);

      for (let i = 0; i < taskDaysToCreate; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      for (const date of dates) {
        await createDailyTasks(testUserId, date);
        addToLog(`✅ Created tasks for ${date}`);
      }

      addToLog('🎉 Dummy tasks created successfully!');
      // Refresh current day tasks if viewing same date
      if (dates.includes(selectedTaskDate)) {
        await handleGetTasksForSelectedDate();
      }
    } catch (error) {
      addToLog(`❌ Error creating dummy tasks: ${error}`);
    }
  };

  // Toggle specific task by ID
  const handleToggleSpecificTask = async () => {
    if (!currentDayTasks || !selectedTaskId) {
      addToLog('❌ Please select a task to toggle');
      return;
    }

    try {
      const task = currentDayTasks.specialTasks.find(
        t => t.id === selectedTaskId,
      );
      if (!task) {
        addToLog(`❌ Task with ID ${selectedTaskId} not found`);
        return;
      }

      const newStatus = !task.completed;
      await updateSpecialTaskStatus(
        testUserId,
        selectedTaskDate,
        selectedTaskId,
        newStatus,
      );

      addToLog(
        `✅ Toggled task "${task.title}" to ${
          newStatus ? 'completed ✅' : 'pending ❌'
        }`,
      );

      // Refresh tasks
      await handleGetTasksForSelectedDate();
    } catch (error) {
      addToLog(`❌ Error toggling task: ${error}`);
    }
  };

  // Toggle all tasks for the selected date
  const handleToggleAllTasks = async () => {
    if (!currentDayTasks) {
      addToLog('❌ No tasks found for the selected date');
      return;
    }

    try {
      addToLog(`🔄 Toggling all tasks for ${selectedTaskDate}...`);

      for (const task of currentDayTasks.specialTasks) {
        await updateSpecialTaskStatus(
          testUserId,
          selectedTaskDate,
          task.id,
          !task.completed,
        );
      }

      addToLog(`✅ Toggled ${currentDayTasks.specialTasks.length} tasks`);
      await handleGetTasksForSelectedDate();
    } catch (error) {
      addToLog(`❌ Error toggling all tasks: ${error}`);
    }
  };

  // Mark all tasks as completed
  const handleCompleteAllTasks = async () => {
    if (!currentDayTasks) {
      addToLog('❌ No tasks found for the selected date');
      return;
    }

    try {
      addToLog(`✅ Marking all tasks as completed for ${selectedTaskDate}...`);

      for (const task of currentDayTasks.specialTasks) {
        if (!task.completed) {
          await updateSpecialTaskStatus(
            testUserId,
            selectedTaskDate,
            task.id,
            true,
          );
        }
      }

      addToLog(`✅ Completed all tasks for ${selectedTaskDate}`);
      await handleGetTasksForSelectedDate();
    } catch (error) {
      addToLog(`❌ Error completing all tasks: ${error}`);
    }
  };

  // Reset all tasks to pending
  const handleResetAllTasks = async () => {
    if (!currentDayTasks) {
      addToLog('❌ No tasks found for the selected date');
      return;
    }

    try {
      addToLog(`🔄 Resetting all tasks for ${selectedTaskDate}...`);

      for (const task of currentDayTasks.specialTasks) {
        if (task.completed) {
          await updateSpecialTaskStatus(
            testUserId,
            selectedTaskDate,
            task.id,
            false,
          );
        }
      }

      addToLog(`🔄 Reset all tasks for ${selectedTaskDate}`);
      await handleGetTasksForSelectedDate();
    } catch (error) {
      addToLog(`❌ Error resetting all tasks: ${error}`);
    }
  };

  // Test AsyncStorage user functionality
  const handleTestAsyncStorageUser = async () => {
    try {
      addToLog('🧪 Testing AsyncStorage User System...');

      // Test creating a user
      const testUser = await createUser(9999, {
        username: 'TestUser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
      });

      addToLog(`✅ Created test user: ${testUser.profile.username}`);

      // Test retrieving the user
      const retrievedUser = await getUserById(9999);
      if (retrievedUser) {
        addToLog(`✅ Retrieved user: ${retrievedUser.profile.username}`);
      } else {
        addToLog('❌ Failed to retrieve user');
      }

      addToLog('🎉 AsyncStorage User test passed!');
    } catch (error) {
      addToLog(`❌ AsyncStorage User error: ${error}`);
    }
  };

  // View all AsyncStorage data for a user
  const handleViewAsyncStorageData = async () => {
    try {
      addToLog(`🔍 Viewing AsyncStorage data for user ${testUserId}...`);

      const [profileData, goalsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(`user_${testUserId}_profile`),
        AsyncStorage.getItem(`user_${testUserId}_goals`),
        AsyncStorage.getItem(`user_${testUserId}_settings`),
      ]);

      const profile = profileData ? JSON.parse(profileData) : null;
      const goals = goalsData ? JSON.parse(goalsData) : null;
      const settings = settingsData ? JSON.parse(settingsData) : null;

      setAsyncStorageData({profile, goals, settings});

      if (profile) {
        addToLog(`✅ Profile: ${profile.username} (${profile.email})`);
      }
      if (goals) {
        addToLog(
          `✅ Goals: Zikr=${goals.monthlyZikrGoal}, Quran=${goals.monthlyQuranPagesGoal}`,
        );
        setEditingGoals({
          monthlyZikrGoal: goals.monthlyZikrGoal.toString(),
          monthlyQuranPagesGoal: goals.monthlyQuranPagesGoal.toString(),
          monthlyCharityGoal: goals.monthlyCharityGoal.toString(),
          monthlyFastingDaysGoal: goals.monthlyFastingDaysGoal.toString(),
        });
      }
      if (settings) {
        addToLog(
          `✅ Settings: Theme=${settings.theme}, Language=${settings.appLanguage}`,
        );
        setEditingSettings({
          theme: settings.theme || '',
          appLanguage: settings.appLanguage || '',
          preferredMadhab: settings.preferredMadhab || '',
          location: settings.location || '',
          masjid: settings.masjid || '',
        });
      }

      if (!profile && !goals && !settings) {
        addToLog(`❌ No AsyncStorage data found for user ${testUserId}`);
      }
    } catch (error) {
      addToLog(`❌ Error reading AsyncStorage: ${error}`);
    }
  };

  // Update user goals
  const handleUpdateGoals = async () => {
    try {
      addToLog('📝 Updating user goals...');

      const goalsToUpdate = {
        monthlyZikrGoal: parseInt(editingGoals.monthlyZikrGoal) || 0,
        monthlyQuranPagesGoal:
          parseInt(editingGoals.monthlyQuranPagesGoal) || 0,
        monthlyCharityGoal: parseInt(editingGoals.monthlyCharityGoal) || 0,
        monthlyFastingDaysGoal:
          parseInt(editingGoals.monthlyFastingDaysGoal) || 0,
      };

      await updateUserGoals(testUserId, goalsToUpdate);
      addToLog('✅ Goals updated successfully!');

      // Refresh data
      await handleViewAsyncStorageData();
    } catch (error) {
      addToLog(`❌ Error updating goals: ${error}`);
    }
  };

  // Update user settings
  const handleUpdateSettings = async () => {
    try {
      addToLog('⚙️ Updating user settings...');

      const settingsToUpdate = {
        theme: editingSettings.theme,
        appLanguage: editingSettings.appLanguage,
        preferredMadhab: editingSettings.preferredMadhab,
        location: editingSettings.location,
        masjid: editingSettings.masjid,
      };

      await updateUserSettings(testUserId, settingsToUpdate);
      addToLog('✅ Settings updated successfully!');

      // Refresh data
      await handleViewAsyncStorageData();
    } catch (error) {
      addToLog(`❌ Error updating settings: ${error}`);
    }
  };

  // Clear all AsyncStorage data for a user
  const handleClearUserData = async () => {
    try {
      addToLog(`🗑️ Clearing all data for user ${testUserId}...`);

      await Promise.all([
        AsyncStorage.removeItem(`user_${testUserId}_profile`),
        AsyncStorage.removeItem(`user_${testUserId}_goals`),
        AsyncStorage.removeItem(`user_${testUserId}_settings`),
      ]);

      setAsyncStorageData({});
      addToLog('✅ User data cleared successfully!');
    } catch (error) {
      addToLog(`❌ Error clearing user data: ${error}`);
    }
  };

  // Create test user with custom data
  const handleCreateTestUser = async () => {
    try {
      addToLog(`👤 Creating test user ${testUserId}...`);

      await createUser(
        testUserId,
        {
          username: `TestUser_${testUserId}`,
          email: `test${testUserId}@example.com`,
          phoneNumber: `+123456${testUserId}`,
        },
        {
          monthlyZikrGoal: 500,
          monthlyQuranPagesGoal: 15,
          monthlyCharityGoal: 50,
          monthlyFastingDaysGoal: 10,
        },
        {
          theme: 'light',
          appLanguage: 'en',
          preferredMadhab: 'Hanafi',
          location: 'Test City',
          masjid: 'Test Mosque',
        },
      );

      addToLog('✅ Test user created successfully!');
      await handleViewAsyncStorageData();
    } catch (error) {
      addToLog(`❌ Error creating test user: ${error}`);
    }
  };

  // Test the new efficient recent tasks method
  const handleGetRecentTasks = async () => {
    try {
      addToLog(
        `🔍 Getting recent tasks for user ${testUserId} (last 3 days)...`,
      );

      const recentTasks = await getRecentDailyTasks(testUserId, 3);

      if (recentTasks && recentTasks.length > 0) {
        addToLog(`✅ Found ${recentTasks.length} days of recent tasks:`);

        recentTasks.forEach(dayTask => {
          const completedTasks = dayTask.specialTasks.filter(
            t => t.completed,
          ).length;
          addToLog(
            `   ${dayTask.date}: ${completedTasks}/${dayTask.specialTasks.length} tasks completed`,
          );
        });

        setDailyTasksData(recentTasks);
      } else {
        addToLog(`❌ No recent tasks found`);
        setDailyTasksData([]);
      }
    } catch (error) {
      addToLog(`❌ Error getting recent tasks: ${error}`);
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
          <Text style={styles.sectionTitle}>📋 Daily Tasks Management</Text>

          {/* Task Creation Controls */}
          <View style={styles.taskControlsContainer}>
            <Text style={styles.subsectionTitle}>➕ Create Tasks</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Start Date:</Text>
              <TextInput
                style={styles.dateInput}
                value={selectedTaskDate}
                onChangeText={setSelectedTaskDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Days to Create:</Text>
              <TextInput
                style={styles.numberInput}
                value={taskDaysToCreate.toString()}
                onChangeText={text => setTaskDaysToCreate(parseInt(text) || 1)}
                placeholder="3"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateDummyTasksForDays}>
                <Text style={styles.buttonText}>
                  Create {taskDaysToCreate} Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleGetRecentTasks}>
                <Text style={styles.buttonText}>Get Recent</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Viewing Controls */}
          <View style={styles.taskControlsContainer}>
            <Text style={styles.subsectionTitle}>👁️ View Tasks</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>View Date:</Text>
              <TextInput
                style={styles.dateInput}
                value={selectedTaskDate}
                onChangeText={setSelectedTaskDate}
                placeholder="YYYY-MM-DD"
              />
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleGetTasksForSelectedDate}>
                <Text style={styles.buttonText}>Load Tasks</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Management Controls - Only show when tasks are loaded */}
          {currentDayTasks && (
            <View style={styles.taskControlsContainer}>
              <Text style={styles.subsectionTitle}>
                🔧 Manage Tasks for {selectedTaskDate}
              </Text>

              {/* Quick Actions */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={handleCompleteAllTasks}>
                  <Text style={styles.buttonText}>Complete All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.warningButton}
                  onPress={handleResetAllTasks}>
                  <Text style={styles.buttonText}>Reset All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handleToggleAllTasks}>
                  <Text style={styles.buttonText}>Toggle All</Text>
                </TouchableOpacity>
              </View>

              {/* Individual Task Controls */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Task ID:</Text>
                <TextInput
                  style={styles.taskIdInput}
                  value={selectedTaskId}
                  onChangeText={setSelectedTaskId}
                  placeholder="Enter task ID"
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={handleToggleSpecificTask}>
                  <Text style={styles.buttonText}>Toggle</Text>
                </TouchableOpacity>
              </View>

              {/* Task Summary */}
              <View style={styles.taskSummary}>
                <Text style={styles.summaryText}>
                  📊 Summary:{' '}
                  {currentDayTasks.specialTasks.filter(t => t.completed).length}
                  /{currentDayTasks.specialTasks.length} completed
                </Text>
                <Text style={styles.summaryText}>
                  📿 Zikr: {currentDayTasks.totalZikrCount} | 📖 Quran:{' '}
                  {currentDayTasks.quranPagesRead} pages
                </Text>
              </View>
            </View>
          )}

          {/* Legacy Controls */}
          <View style={styles.legacyControls}>
            <Text style={styles.subsectionTitle}>🔧 Legacy Controls</Text>
            <View style={styles.buttonRow}>
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
          </View>
        </View>

        {/* Enhanced Task Display */}
        {currentDayTasks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📊 Tasks for {selectedTaskDate}
            </Text>

            <View style={styles.taskDisplayContainer}>
              {/* Prayer Status */}
              <View style={styles.prayerStatusContainer}>
                <Text style={styles.subsectionTitle}>🕌 Prayer Status</Text>
                <View style={styles.prayerGrid}>
                  <Text
                    style={[
                      styles.prayerItem,
                      currentDayTasks.fajrStatus === 'completed' &&
                        styles.completedPrayer,
                    ]}>
                    Fajr:{' '}
                    {currentDayTasks.fajrStatus === 'completed' ? '✅' : '❌'}
                  </Text>
                  <Text
                    style={[
                      styles.prayerItem,
                      currentDayTasks.dhuhrStatus === 'completed' &&
                        styles.completedPrayer,
                    ]}>
                    Dhuhr:{' '}
                    {currentDayTasks.dhuhrStatus === 'completed' ? '✅' : '❌'}
                  </Text>
                  <Text
                    style={[
                      styles.prayerItem,
                      currentDayTasks.asrStatus === 'completed' &&
                        styles.completedPrayer,
                    ]}>
                    Asr:{' '}
                    {currentDayTasks.asrStatus === 'completed' ? '✅' : '❌'}
                  </Text>
                  <Text
                    style={[
                      styles.prayerItem,
                      currentDayTasks.maghribStatus === 'completed' &&
                        styles.completedPrayer,
                    ]}>
                    Maghrib:{' '}
                    {currentDayTasks.maghribStatus === 'completed'
                      ? '✅'
                      : '❌'}
                  </Text>
                  <Text
                    style={[
                      styles.prayerItem,
                      currentDayTasks.ishaStatus === 'completed' &&
                        styles.completedPrayer,
                    ]}>
                    Isha:{' '}
                    {currentDayTasks.ishaStatus === 'completed' ? '✅' : '❌'}
                  </Text>
                </View>
              </View>

              {/* Special Tasks */}
              <View style={styles.specialTasksContainer}>
                <Text style={styles.subsectionTitle}>⭐ Special Tasks</Text>
                {currentDayTasks.specialTasks.map((task, index) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      task.completed && styles.completedTaskItem,
                    ]}
                    onPress={() => setSelectedTaskId(task.id)}>
                    <View style={styles.taskContent}>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.completed && styles.completedTaskText,
                        ]}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskId}>ID: {task.id}</Text>
                      <Text style={styles.taskStatus}>
                        {task.completed ? '✅ Completed' : '❌ Pending'}
                      </Text>
                    </View>
                    {selectedTaskId === task.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
  taskControlsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.primary,
  },
  createButton: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  viewButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
  },
  successButton: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  warningButton: {
    backgroundColor: '#ff9500',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  toggleButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
  },
  taskIdInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  taskSummary: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  legacyControls: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  taskDisplayContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  prayerStatusContainer: {
    marginBottom: 20,
  },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prayerItem: {
    width: '48%',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  completedPrayer: {
    backgroundColor: '#d4edda',
    borderColor: colors.success,
  },
  specialTasksContainer: {
    marginTop: 10,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  completedTaskItem: {
    backgroundColor: '#d4edda',
    borderColor: colors.success,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});

export default DatabaseTestScreen;
