import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from 'react-native';
import {useDatabase} from '../services/db/databaseProvider';
import {Q} from '@nozbe/watermelondb';
import {observeAllPrayerTimes} from '../services/db/PrayerServices';
import {getRecentDailyTasks} from '../services/db/dailyTaskServices';

interface TableData {
  [key: string]: any;
}

const DatabaseScreen: React.FC = () => {
  const {database, isDbReady} = useDatabase();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  // Available tables in the database
  const availableTables = [
    {name: 'prayer_times', label: 'Prayer Times', hasModularFunction: true},
    {name: 'daily_tasks', label: 'Daily Tasks', hasModularFunction: true},
  ];

  useEffect(() => {
    if (isDbReady && selectedTable) {
      loadTableData();
    }
  }, [selectedTable, isDbReady]);

  const loadTableDataWithModularFunction = async () => {
    setLoading(true);
    try {
      console.log(
        `🔍 Loading data from table: ${selectedTable} using modular functions`,
      );

      let data: TableData[] = [];

      if (selectedTable === 'prayer_times') {
        // Use direct query for prayer times (similar to observeAllPrayerTimes)
        const prayerTimesCollection = database!.get('prayer_times');
        const records = await prayerTimesCollection
          .query(Q.sortBy('date', Q.desc))
          .fetch();

        console.log(`📊 Found ${records.length} prayer time records`);
        setRecordCount(records.length);

        data = records.map(record => ({
          id: record.id,
          date: (record as any).date || '',
          day: (record as any).day || '',
          fajr: (record as any).fajr || '',
          dhuhr: (record as any).dhuhr || '',
          asr: (record as any).asr || '',
          maghrib: (record as any).maghrib || '',
          isha: (record as any).isha || '',
          qibla_hour: (record as any).qiblaHour || '',
          created_at: new Date((record as any).createdAt).toLocaleDateString(),
          updated_at: new Date((record as any).updatedAt).toLocaleDateString(),
        }));
      } else if (selectedTable === 'daily_tasks') {
        // Use the modular function to get recent daily tasks
        const daysBack = 30; // Get last 30 days of data

        try {
          const tasks = await getRecentDailyTasks(daysBack);
          console.log(`📊 Found ${tasks.length} daily task records`);
          setRecordCount(tasks.length);

          data = tasks.map(task => ({
            id: task.date, // Use date as ID since it's now the primary key
            date: task.date,
            fajr_status: task.fajrStatus,
            dhuhr_status: task.dhuhrStatus,
            asr_status: task.asrStatus,
            maghrib_status: task.maghribStatus,
            isha_status: task.ishaStatus,
            total_zikr_count: task.totalZikrCount,
            quran_minutes: task.quranMinutes,
            special_tasks_count: task.specialTasks.length,
            special_tasks_summary: task.specialTasks
              .map(t => `${t.title}: ${t.completed ? '✅' : '❌'}`)
              .join(' | '),
          }));
        } catch (error) {
          console.error('Error using modular daily tasks function:', error);
          // Fallback to direct database query
          const collection = database!.get(selectedTable);
          const records = await collection
            .query(Q.sortBy('date', Q.desc))
            .fetch();
          setRecordCount(records.length);

          data = records.map(record => ({
            id: record.id,
            date: (record as any).date || '',
            fajr_status: (record as any).fajrStatus || '',
            dhuhr_status: (record as any).dhuhrStatus || '',
            asr_status: (record as any).asrStatus || '',
            maghrib_status: (record as any).maghribStatus || '',
            isha_status: (record as any).ishaStatus || '',
            total_zikr_count: (record as any).totalZikrCount || 0,
            quran_minutes: (record as any).quranMinutes || 0,
            special_tasks: (record as any).specialTasks || '',
            created_at: new Date(
              (record as any).createdAt,
            ).toLocaleDateString(),
            updated_at: new Date(
              (record as any).updatedAt,
            ).toLocaleDateString(),
          }));
        }
      }

      if (data.length === 0) {
        setTableData([]);
        setHeaders([]);
        Alert.alert('Info', `No data found in ${selectedTable} table`);
        return;
      }

      // Generate headers from the first record
      const tableHeaders = Object.keys(data[0]);
      setHeaders(tableHeaders);
      console.log(`📋 Table headers: ${tableHeaders.join(', ')}`);

      setTableData(data);
      console.log('✅ Table data loaded successfully using modular functions');
    } catch (error) {
      console.error(
        '❌ Error loading table data with modular functions:',
        error,
      );
      Alert.alert(
        'Error',
        `Failed to load data from ${selectedTable}: ${error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTableDataDirect = async () => {
    setLoading(true);
    try {
      console.log(
        `🔍 Loading data from table: ${selectedTable} using direct database query`,
      );

      const collection = database!.get(selectedTable);
      const records = await collection.query().fetch();

      console.log(`📊 Found ${records.length} records in ${selectedTable}`);
      setRecordCount(records.length);

      if (records.length === 0) {
        setTableData([]);
        setHeaders([]);
        Alert.alert('Info', `No data found in ${selectedTable} table`);
        return;
      }

      // Convert WatermelonDB records to plain objects
      const data: TableData[] = records.map(record => {
        const plainObject: TableData = {};

        // Get all fields from the record
        if (selectedTable === 'prayer_times') {
          plainObject.id = record.id;
          plainObject.date = (record as any).date || '';
          plainObject.day = (record as any).day || '';
          plainObject.fajr = (record as any).fajr || '';
          plainObject.dhuhr = (record as any).dhuhr || '';
          plainObject.asr = (record as any).asr || '';
          plainObject.maghrib = (record as any).maghrib || '';
          plainObject.isha = (record as any).isha || '';
          plainObject.qibla_hour = (record as any).qiblaHour || '';
          plainObject.created_at = new Date(
            (record as any).createdAt,
          ).toLocaleDateString();
          plainObject.updated_at = new Date(
            (record as any).updatedAt,
          ).toLocaleDateString();
        } else if (selectedTable === 'daily_tasks') {
          plainObject.id = record.id;
          plainObject.date = (record as any).date || '';
          plainObject.fajr_status = (record as any).fajrStatus || '';
          plainObject.dhuhr_status = (record as any).dhuhrStatus || '';
          plainObject.asr_status = (record as any).asrStatus || '';
          plainObject.maghrib_status = (record as any).maghribStatus || '';
          plainObject.isha_status = (record as any).ishaStatus || '';
          plainObject.total_zikr_count = (record as any).totalZikrCount || 0;
          plainObject.quran_minutes = (record as any).quranMinutes || 0;
          plainObject.special_tasks = (record as any).specialTasks || '';
          plainObject.created_at = new Date(
            (record as any).createdAt,
          ).toLocaleDateString();
          plainObject.updated_at = new Date(
            (record as any).updatedAt,
          ).toLocaleDateString();
        }

        return plainObject;
      });

      // Generate headers from the first record
      if (data.length > 0) {
        const tableHeaders = Object.keys(data[0]);
        setHeaders(tableHeaders);
        console.log(`📋 Table headers: ${tableHeaders.join(', ')}`);
      }

      setTableData(data);
      console.log('✅ Table data loaded successfully using direct query');
    } catch (error) {
      console.error('❌ Error loading table data with direct query:', error);
      Alert.alert(
        'Error',
        `Failed to load data from ${selectedTable}: ${error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable || !database) return;

    const tableConfig = availableTables.find(t => t.name === selectedTable);

    if (tableConfig?.hasModularFunction) {
      console.log(`📦 Using modular function for ${selectedTable}`);
      await loadTableDataWithModularFunction();
    } else {
      console.log(`🔗 Using direct database query for ${selectedTable}`);
      await loadTableDataDirect();
    }
  };

  const handleTableSelect = (tableName: string) => {
    console.log(`🔄 Switching to table: ${tableName}`);
    setSelectedTable(tableName);
    setTableData([]);
    setHeaders([]);
    setRecordCount(0);
  };

  const refreshData = () => {
    if (selectedTable) {
      loadTableData();
    }
  };

  if (!isDbReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Initializing Database...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Explorer</Text>
        <Text style={styles.subtitle}>Select a table to view its data</Text>
      </View>
      {/* Table Selection */}
      <View style={styles.tableSelection}>
        <Text style={styles.sectionTitle}>Available Tables:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {availableTables.map(table => (
            <TouchableOpacity
              key={table.name}
              style={[
                styles.tableButton,
                selectedTable === table.name && styles.selectedTableButton,
              ]}
              onPress={() => handleTableSelect(table.name)}>
              <Text
                style={[
                  styles.tableButtonText,
                  selectedTable === table.name &&
                    styles.selectedTableButtonText,
                ]}>
                {table.label}
              </Text>
              {table.hasModularFunction && (
                <Text style={styles.modularBadge}>📦</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Table Info */}
      {selectedTable && (
        <View style={styles.tableInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Selected Table:</Text>
            <Text style={styles.infoValue}>{selectedTable}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Records Count:</Text>
            <Text style={styles.infoValue}>{recordCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Using:</Text>
            <Text style={styles.infoValue}>
              {availableTables.find(t => t.name === selectedTable)
                ?.hasModularFunction
                ? 'Modular Function 📦'
                : 'Direct Query 🔗'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading table data...</Text>
        </View>
      )}
      {/* Table Display */}
      {!loading && selectedTable && tableData.length > 0 && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>
            {availableTables.find(t => t.name === selectedTable)?.label} Data
          </Text>

          {/* Custom Table Implementation */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                {headers.map((header, index) => (
                  <Text key={index} style={styles.tableHeaderCell}>
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                ))}
              </View>

              {/* Table Body */}
              <FlatList
                data={tableData}
                keyExtractor={(item, index) => `row-${index}`}
                renderItem={({item, index}) => (
                  <View
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.evenRow : styles.oddRow,
                    ]}>
                    {headers.map((header, cellIndex) => (
                      <Text key={cellIndex} style={styles.tableCell}>
                        {String(item[header] || '').length > 30
                          ? String(item[header] || '').substring(0, 30) + '...'
                          : String(item[header] || '')}
                      </Text>
                    ))}
                  </View>
                )}
                showsVerticalScrollIndicator={true}
                style={styles.tableBody}
              />
            </View>
          </ScrollView>
        </View>
      )}
      {/* No Data Message */}
      {!loading &&
        selectedTable &&
        tableData.length === 0 &&
        recordCount === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              📭 No data found in {selectedTable} table
            </Text>
            <Text style={styles.noDataSubtext}>
              Try selecting a different table or add some data first
            </Text>
          </View>
        )}
      {/* No Table Selected */}
      {!selectedTable && (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            🗄️ Select a table above to view its data
          </Text>
          <Text style={styles.featureExplanation}>
            📦 = Uses modular database functions{'\n'}
            🔗 = Uses direct database queries
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  tableSelection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  tableButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTableButton: {
    backgroundColor: '#2196F3',
  },
  tableButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    marginRight: 5,
  },
  selectedTableButtonText: {
    color: 'white',
  },
  modularBadge: {
    fontSize: 12,
  },
  tableInfo: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  tableScrollView: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    minHeight: 40,
  },
  tableHeaderCell: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 35,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: 'white',
  },
  tableCell: {
    fontSize: 11,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    textAlign: 'left',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSelectionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  featureExplanation: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DatabaseScreen;