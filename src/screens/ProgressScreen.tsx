import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {
  getRecentDailyTasks,
  DailyTaskData,
} from '../services/db/dailyTaskServices';
import {getTodayDateString, formatDateString} from '../utils/helpers';

interface ProgressSummary {
  date: string;
  formattedDate: string;
  isToday: boolean;
  prayersCompleted: number;
  totalPrayers: number;
  quranMinutes: number;
  zikrCount: number;
  completionPercentage: number;
}

const ProgressScreen: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressSummary[]>([]);
  const [taskDataMap, setTaskDataMap] = useState<Map<string, DailyTaskData>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateString === getTodayDateString()) {
      return 'Today';
    } else if (dateString === formatDateString(yesterday)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const countCompletedPrayers = useCallback((task: DailyTaskData): number => {
    const statuses = [
      task.fajrStatus,
      task.dhuhrStatus,
      task.asrStatus,
      task.maghribStatus,
      task.ishaStatus,
    ];
    return statuses.filter(status => status === 'home' || status === 'mosque')
      .length;
  }, []);

  const loadProgressData = useCallback(async () => {
    try {
      // Get at least 30 records, but try to get more to ensure we have enough data
      const tasks = await getRecentDailyTasks(50);

      // Create a map for quick task lookup
      const taskMap = new Map<string, DailyTaskData>();
      tasks.forEach(task => {
        taskMap.set(task.date, task);
      });
      setTaskDataMap(taskMap);

      const progressSummary: ProgressSummary[] = tasks.map(task => {
        const prayersCompleted = countCompletedPrayers(task);
        const totalPrayers = 5;
        const completionPercentage = (prayersCompleted / totalPrayers) * 100;

        return {
          date: task.date,
          formattedDate: formatDate(task.date),
          isToday: task.date === getTodayDateString(),
          prayersCompleted,
          totalPrayers,
          quranMinutes: task.quranMinutes,
          zikrCount: task.totalZikrCount,
          completionPercentage,
        };
      });

      // Sort by date (newest first)
      progressSummary.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Ensure we display at least 30 records
      const recordsToShow = Math.max(30, progressSummary.length);
      setProgressData(progressSummary.slice(0, recordsToShow));
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [formatDate, countCompletedPrayers]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProgressData();
  }, [loadProgressData]);

  const getPrayerStatus = (
    task: DailyTaskData,
    prayer: string,
  ): 'completed' | 'missed' => {
    const status = task[`${prayer}Status` as keyof DailyTaskData] as string;
    return status === 'home' || status === 'mosque' ? 'completed' : 'missed';
  };

  const PrayerIndicator: React.FC<{
    status: 'completed' | 'missed';
    prayer: string;
  }> = ({status, prayer}) => (
    <View style={styles.prayerIndicator}>
      <View
        style={[
          styles.prayerDot,
          status === 'completed' ? styles.prayerCompleted : styles.prayerMissed,
        ]}
      />
      <Text style={styles.prayerLabel}>{prayer}</Text>
    </View>
  );

  const TableHeader: React.FC = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
      <Text style={[styles.tableHeaderText, styles.prayersColumn]}>
        Prayers
      </Text>
      <Text style={[styles.tableHeaderText, styles.quranColumn]}>Quran</Text>
      <Text style={[styles.tableHeaderText, styles.zikrColumn]}>Zikr</Text>
    </View>
  );

  const TableRow: React.FC<{
    item: ProgressSummary;
    taskData?: DailyTaskData;
  }> = ({item, taskData}) => (
    <View style={[styles.tableRow, item.isToday && styles.todayRow]}>
      {/* Date Column */}
      <View style={styles.dateColumn}>
        <Text style={[styles.tableDateText, item.isToday && styles.todayText]}>
          {item.formattedDate}
        </Text>
        <Text style={styles.tableDateSubtext}>{item.date.slice(5)}</Text>
      </View>

      {/* Prayers Column - 5 Individual Prayer Indicators */}
      <View style={styles.prayersColumn}>
        <View style={styles.prayersGrid}>
          {taskData && (
            <>
              <PrayerIndicator
                status={getPrayerStatus(taskData, 'fajr')}
                prayer="F"
              />
              <PrayerIndicator
                status={getPrayerStatus(taskData, 'dhuhr')}
                prayer="D"
              />
              <PrayerIndicator
                status={getPrayerStatus(taskData, 'asr')}
                prayer="A"
              />
              <PrayerIndicator
                status={getPrayerStatus(taskData, 'maghrib')}
                prayer="M"
              />
              <PrayerIndicator
                status={getPrayerStatus(taskData, 'isha')}
                prayer="I"
              />
            </>
          )}
        </View>
      </View>

      {/* Quran Column */}
      <View style={styles.quranColumn}>
        <Text style={styles.tableValue}>{item.quranMinutes}</Text>
        <Text style={styles.tableUnit}>min</Text>
      </View>

      {/* Zikr Column */}
      <View style={styles.zikrColumn}>
        <Text style={styles.tableValue}>{item.zikrCount}</Text>
        <Text style={styles.tableUnit}>count</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
        <Text style={styles.headerSubtitle}>Track your spiritual journey</Text>
      </View>

      {/* Full Screen Table */}
      <View style={styles.tableContainer}>
        <TableHeader />

        {progressData.length > 0 ? (
          <ScrollView
            style={styles.tableScrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {progressData.map(item => (
              <TableRow
                key={item.date}
                item={item}
                taskData={taskDataMap.get(item.date)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No progress data available</Text>
            <Text style={styles.emptySubtext}>
              Start completing your daily tasks to see progress here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.prayerBlue,
    fontSize: 16,
  },

  // Table Styles
  tableContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  tableScrollView: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  tableHeaderText: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.dark,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    alignItems: 'center',
  },
  todayRow: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  // Column Styles
  dateColumn: {
    flex: 2,
    alignItems: 'flex-start',
  },
  prayersColumn: {
    flex: 3,
    alignItems: 'center',
  },
  quranColumn: {
    flex: 1.5,
    alignItems: 'center',
  },
  zikrColumn: {
    flex: 1.5,
    alignItems: 'center',
  },

  // Table Cell Content
  tableDateText: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.dark,
  },
  tableDateSubtext: {
    ...typography.caption,
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  todayText: {
    color: colors.primary,
  },
  tableValue: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  tableUnit: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },

  // Prayer Indicators
  prayersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  prayerIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  prayerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  prayerCompleted: {
    backgroundColor: colors.success,
  },
  prayerMissed: {
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  prayerLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProgressScreen;
