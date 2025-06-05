import {getPrayerTimesForDate, import2025PrayerTimes} from './PrayerServices';

let isInitialized = false;

export const initializePrayerTimesDatabase = async (): Promise<void> => {
  if (isInitialized) {
    console.log('Database already initialized, skipping...');
    return;
  }

  try {
    console.log('🔄 Checking if prayer times data exists...');

    // Check multiple dates to ensure data completeness
    const testDates = ['2025-01-01', '2025-06-01', '2025-12-31'];
    const existingData = await Promise.all(
      testDates.map(date => getPrayerTimesForDate(date)),
    );

    const hasCompleteData = existingData.every(data => data !== null);

    if (!hasCompleteData) {
      console.log('📥 Importing 2025 prayer times...');
      await import2025PrayerTimes();
      console.log('✅ Prayer times imported successfully');
    } else {
      console.log('✅ Complete prayer times data already exists');
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Error initializing prayer times database:', error);
    throw error;
  }
};
