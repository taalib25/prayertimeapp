import {getDatabase} from './dbInitalizer';
import {
  getPrayerTimesForDate as getWatermelonPrayerTimes,
  getAvailableDates as getWatermelonAvailableDates,
  PrayerTimesData,
} from './watermelonServices';

/**
 * Get prayer times for a specific date with correct range-based lookup
 */
export const getPrayerTimesForDate = async (
  targetDate: string,
): Promise<PrayerTimesData | null> => {
  try {
    console.log(`🔍 Searching for prayer times for date: ${targetDate}`);
    const db = await getDatabase();

    // First try to get exact date
    const [exactResults] = await db.executeSql(
      'SELECT * FROM prayer_times WHERE date = ?',
      [targetDate],
    );

    console.log(`Exact search results: ${exactResults.rows.length} rows found`);

    if (exactResults.rows.length > 0) {
      const row = exactResults.rows.item(0);
      console.log(`✅ Found exact match for ${targetDate}:`, row);
      return {
        date: row.date,
        day: row.day,
        fajr: row.fajr,
        shuruq: row.shuruq,
        dhuha: row.dhuha,
        dhuhr: row.dhuhr,
        asr: row.asr,
        maghrib: row.maghrib,
        isha: row.isha,
        qibla_hour: row.qibla_hour,
        isInterpolated: false,
      };
    }

    console.log(
      `No exact match found. Finding the range that contains ${targetDate}...`,
    );

    // Find the start date of the range (most recent date <= target)
    const [startResults] = await db.executeSql(
      'SELECT * FROM prayer_times WHERE date <= ? ORDER BY date DESC LIMIT 1',
      [targetDate],
    );

    if (startResults.rows.length === 0) {
      console.log(
        `❌ No prayer times found for ${targetDate} or any earlier date`,
      );
      return null;
    }

    const startRow = startResults.rows.item(0);
    console.log(`📅 Found range start date: ${startRow.date}`);

    // Find the end date of the range (next date after start date)
    const [endResults] = await db.executeSql(
      'SELECT date FROM prayer_times WHERE date > ? ORDER BY date ASC LIMIT 1',
      [startRow.date],
    );

    const endDate =
      endResults.rows.length > 0 ? endResults.rows.item(0).date : null;
    console.log(`📅 Range end date: ${endDate || 'no end (ongoing)'}`);

    // Check if target date falls within this range
    const isInRange = endDate ? targetDate < endDate : true; // If no end date, range is ongoing

    if (!isInRange) {
      console.log(
        `❌ Target date ${targetDate} falls outside available ranges`,
      );
      return null;
    }

    console.log(
      `✅ Using prayer times from ${startRow.date} for ${targetDate} (range: ${
        startRow.date
      } to ${endDate || 'ongoing'})`,
    );

    return {
      date: targetDate, // Return the requested date
      day: getDayName(targetDate), // Calculate the day for the requested date
      fajr: startRow.fajr,
      shuruq: startRow.shuruq,
      dhuha: startRow.dhuha,
      dhuhr: startRow.dhuhr,
      asr: startRow.asr,
      maghrib: startRow.maghrib,
      isha: startRow.isha,
      qibla_hour: startRow.qibla_hour,
      originalDate: startRow.date, // Keep track of the source date
      isInterpolated: true,
    };
  } catch (error) {
    console.error(
      `❌ Error getting prayer times for date ${targetDate}:`,
      error,
    );
    throw error;
  }
};

/**
 * Get prayer times with detailed range information - Updated for WatermelonDB
 */
export const getPrayerTimesWithRangeInfo = async (
  targetDate: string,
): Promise<{
  prayerTimes: any | null;
  rangeInfo: {
    startDate: string;
    endDate: string | null;
    daysInRange: number;
    targetInRange: boolean;
  } | null;
}> => {
  try {
    console.log(`🔍 Getting range info for ${targetDate}`);

    const prayerTimes = await getWatermelonPrayerTimes(targetDate);

    if (!prayerTimes) {
      return {prayerTimes: null, rangeInfo: null};
    }

    // If it's an exact match, no range info needed
    if (!prayerTimes.isInterpolated) {
      return {prayerTimes, rangeInfo: null};
    }

    // For interpolated results, get the range details
    const availableDates = await getWatermelonAvailableDates();
    const startDate = prayerTimes.originalDate!;
    const startIndex = availableDates.indexOf(startDate);
    const endDate =
      startIndex < availableDates.length - 1
        ? availableDates[startIndex + 1]
        : null;

    console.log(
      `📊 Range Info - Start: ${startDate}, End: ${endDate || 'end of data'}`,
    );

    // Calculate days in range
    let daysInRange = 1;
    if (endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      daysInRange = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
    } else {
      daysInRange = 999; // Ongoing range
    }

    // Check if target is actually in range
    const targetInRange = endDate ? targetDate < endDate : true;

    return {
      prayerTimes,
      rangeInfo: {
        startDate,
        endDate,
        daysInRange,
        targetInRange,
      },
    };
  } catch (error) {
    console.error('❌ Error getting prayer times with range info:', error);
    return {prayerTimes: null, rangeInfo: null};
  }
};

/**
 * Helper function to get day name from date string
 */
const getDayName = (dateString: string): string => {
  try {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  } catch (error) {
    console.error('Error getting day name:', error);
    return 'Unknown';
  }
};

/**
 * Get all available prayer times dates
 */
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    const db = await getDatabase();

    const [results] = await db.executeSql(
      'SELECT date FROM prayer_times ORDER BY date',
      [],
    );

    const dates: string[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      dates.push(results.rows.item(i).date);
    }

    console.log(`📅 Found ${dates.length} available dates`);
    return dates;
  } catch (error) {
    console.error('❌ Error getting available dates:', error);
    throw error;
  }
};

/**
 * Legacy compatibility functions
 */
export const getDateRanges = async () => {
  const dates = await getWatermelonAvailableDates();
  const ranges = [];

  for (let i = 0; i < dates.length; i++) {
    const startDate = dates[i];
    const endDate = i < dates.length - 1 ? dates[i + 1] : null;

    let daysInRange = 1;
    if (endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      daysInRange = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
    } else {
      daysInRange = 999; // Ongoing range
    }

    ranges.push({
      startDate,
      endDate,
      daysInRange,
    });
  }

  return ranges;
};

export const getAllDateRangesWithCoverage = async () => {
  const dates = await getWatermelonAvailableDates();
  const ranges = [];

  for (let i = 0; i < dates.length; i++) {
    const startDate = dates[i];
    const endDate = i < dates.length - 1 ? dates[i + 1] : null;
    const prayerTimes = await getWatermelonPrayerTimes(startDate);

    let daysInRange = 1;
    if (endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      daysInRange = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
    } else {
      daysInRange = 999; // Ongoing range
    }

    ranges.push({
      startDate,
      endDate,
      daysInRange,
      samplePrayerTimes: {
        fajr: prayerTimes?.fajr || '',
        dhuhr: prayerTimes?.dhuhr || '',
        maghrib: prayerTimes?.maghrib || '',
      },
    });
  }

  return ranges;
};

export const testInterpolationLogic = async () => {
  const availableDates = await getWatermelonAvailableDates();

  const testDates = [
    '2025-06-01',
    '2025-06-02',
    '2025-06-03',
    '2025-06-05',
    '2025-06-07',
    '2025-12-31',
  ];

  const testResults = [];

  for (const testDate of testDates) {
    console.log(`\n🧪 Testing interpolation for ${testDate}`);
    const result = await getPrayerTimesWithRangeInfo(testDate);

    if (!result.prayerTimes) {
      testResults.push({
        testDate,
        result: 'not_found',
      });
    } else if (!result.prayerTimes.isInterpolated) {
      testResults.push({
        testDate,
        result: 'exact',
        sourceDate: result.prayerTimes.date,
      });
    } else {
      testResults.push({
        testDate,
        result: 'interpolated',
        sourceDate: result.prayerTimes.originalDate,
        rangeStart: result.rangeInfo?.startDate,
        rangeEnd: result.rangeInfo?.endDate,
      });
    }
  }

  return {availableDates, testResults};
};

/**
 * Test function to check if prayer_times table exists and has data
 */
export const testPrayerTimesTable = async (): Promise<{
  tableExists: boolean;
  rowCount: number;
  sampleData: any[];
}> => {
  try {
    const db = await getDatabase();

    // Check if table exists
    const [tableCheck] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='prayer_times'",
      [],
    );

    if (tableCheck.rows.length === 0) {
      return {tableExists: false, rowCount: 0, sampleData: []};
    }

    // Count rows
    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as count FROM prayer_times',
      [],
    );
    const rowCount = countResult.rows.item(0).count;

    // Get sample data
    const [sampleResult] = await db.executeSql(
      'SELECT * FROM prayer_times ORDER BY date LIMIT 3',
      [],
    );

    const sampleData = [];
    for (let i = 0; i < sampleResult.rows.length; i++) {
      sampleData.push(sampleResult.rows.item(i));
    }

    return {tableExists: true, rowCount, sampleData};
  } catch (error) {
    console.error('❌ Error testing prayer_times table:', error);
    throw error;
  }
};
