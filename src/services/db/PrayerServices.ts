import {Q} from '@nozbe/watermelondb';
import database from '.';
import PrayerTimesModel from '../../model/PrayerTimes';
export interface PrayerTimesData {
  date: string;
  day: string;
  fajr: string;
  shuruq: string;
  dhuha: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  qibla_hour: string | null;
  originalDate?: string;
  isInterpolated?: boolean;
}

/**
 * Helper function to get day name from date string
 */
const getDayName = (dateString: string): string => {
  try {
    const date = new Date(dateString + 'T00:00:00');
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
 * Get prayer times for a specific date with WatermelonDB
 */
export const getPrayerTimesForDate = async (
  targetDate: string,
): Promise<PrayerTimesData | null> => {
  try {
    console.log(`🔍 Searching for prayer times for date: ${targetDate}`);

    const prayerTimesCollection =
      database.get<PrayerTimesModel>('prayer_times');

    // First try to get exact date
    const exactMatch = await prayerTimesCollection
      .query(Q.where('date', targetDate))
      .fetch();

    if (exactMatch.length > 0) {
      const prayerTime = exactMatch[0];
      console.log(`✅ Found exact match for ${targetDate}`);
      return {
        date: prayerTime.date,
        day: prayerTime.day,
        fajr: prayerTime.fajr,
        shuruq: prayerTime.shuruq,
        dhuha: prayerTime.dhuha,
        dhuhr: prayerTime.dhuhr,
        asr: prayerTime.asr,
        maghrib: prayerTime.maghrib,
        isha: prayerTime.isha,
        qibla_hour: prayerTime.qiblaHour || null,
        isInterpolated: false,
      };
    }

    console.log(
      `No exact match found. Finding the range that contains ${targetDate}...`,
    );

    // Find the start date of the range (most recent date <= target)
    const startMatches = await prayerTimesCollection
      .query(
        Q.where('date', Q.lte(targetDate)),
        Q.sortBy('date', Q.desc),
        Q.take(1),
      )
      .fetch();

    if (startMatches.length === 0) {
      console.log(
        `❌ No prayer times found for ${targetDate} or any earlier date`,
      );
      return null;
    }

    const startPrayerTime = startMatches[0];
    
    // Find the end date of the range (next date after start date)
    const endMatches = await prayerTimesCollection
      .query(
        Q.where('date', Q.gt(startPrayerTime.date)),
        Q.sortBy('date', Q.asc),
        Q.take(1),
      )
      .fetch();

    const endDate = endMatches.length > 0 ? endMatches[0].date : null;
    
    // Check if target date falls within this range
    const isInRange = endDate ? targetDate < endDate : true;

    if (!isInRange) {
      console.log(
        `❌ Target date ${targetDate} falls outside available ranges`,
      );
      return null;
    }

    console.log(
      `✅ Using prayer times from ${
        startPrayerTime.date
      } for ${targetDate} (range: ${startPrayerTime.date} to ${
        endDate || 'ongoing'
      })`,
    );

    return {
      date: targetDate,
      day: getDayName(targetDate),
      fajr: startPrayerTime.fajr,
      shuruq: startPrayerTime.shuruq,
      dhuha: startPrayerTime.dhuha,
      dhuhr: startPrayerTime.dhuhr,
      asr: startPrayerTime.asr,
      maghrib: startPrayerTime.maghrib,
      isha: startPrayerTime.isha,
      qibla_hour: startPrayerTime.qiblaHour || null,
      originalDate: startPrayerTime.date,
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
 * Create or update prayer times
 */
export const createOrUpdatePrayerTimes = async (
  data: Omit<PrayerTimesData, 'isInterpolated' | 'originalDate'>,
) => {
  try {
    const prayerTimesCollection =
      database.get<PrayerTimesModel>('prayer_times');

    // Check if record exists
    const existing = await prayerTimesCollection
      .query(Q.where('date', data.date))
      .fetch();

    if (existing.length > 0) {
      // Update existing
      await database.write(async () => {
        await existing[0].update(prayerTime => {
          prayerTime.day = data.day;
          prayerTime.fajr = data.fajr;
          prayerTime.shuruq = data.shuruq;
          prayerTime.dhuha = data.dhuha;
          prayerTime.dhuhr = data.dhuhr;
          prayerTime.asr = data.asr;
          prayerTime.maghrib = data.maghrib;
          prayerTime.isha = data.isha;
          prayerTime.qiblaHour = data.qibla_hour || undefined;
        });
      });
      console.log(`✅ Updated prayer times for ${data.date}`);
    } else {
      // Create new
      await database.write(async () => {
        await prayerTimesCollection.create(prayerTime => {
          prayerTime.date = data.date;
          prayerTime.day = data.day;
          prayerTime.fajr = data.fajr;
          prayerTime.shuruq = data.shuruq;
          prayerTime.dhuha = data.dhuha;
          prayerTime.dhuhr = data.dhuhr;
          prayerTime.asr = data.asr;
          prayerTime.maghrib = data.maghrib;
          prayerTime.isha = data.isha;
          prayerTime.qiblaHour = data.qibla_hour || undefined;
        });
      });
      console.log(`✅ Created prayer times for ${data.date}`);
    }
  } catch (error) {
    console.error('❌ Error creating/updating prayer times:', error);
    throw error;
  }
};

/**
 * Get all available dates
 */
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    const prayerTimesCollection =
      database.get<PrayerTimesModel>('prayer_times');
    const allPrayerTimes = await prayerTimesCollection
      .query(Q.sortBy('date', Q.asc))
      .fetch();

    return allPrayerTimes.map(pt => pt.date);
  } catch (error) {
    console.error('❌ Error getting available dates:', error);
    throw error;
  }
};

/**
 * Bulk import prayer times
 */
export const bulkImportPrayerTimes = async (
  prayerTimesArray: Omit<PrayerTimesData, 'isInterpolated' | 'originalDate'>[],
) => {
  try {
    await database.write(async () => {
      const prayerTimesCollection =
        database.get<PrayerTimesModel>('prayer_times');

      for (const data of prayerTimesArray) {
        // Check if exists
        const existing = await prayerTimesCollection
          .query(Q.where('date', data.date))
          .fetch();

        if (existing.length > 0) {
          // Update existing
          await existing[0].update(prayerTime => {
            prayerTime.day = data.day;
            prayerTime.fajr = data.fajr;
            prayerTime.shuruq = data.shuruq;
            prayerTime.dhuha = data.dhuha;
            prayerTime.dhuhr = data.dhuhr;
            prayerTime.asr = data.asr;
            prayerTime.maghrib = data.maghrib;
            prayerTime.isha = data.isha;
            prayerTime.qiblaHour = data.qibla_hour || undefined;
          });
        } else {
          // Create new
          await prayerTimesCollection.create(prayerTime => {
            prayerTime.date = data.date;
            prayerTime.day = data.day;
            prayerTime.fajr = data.fajr;
            prayerTime.shuruq = data.shuruq;
            prayerTime.dhuha = data.dhuha;
            prayerTime.dhuhr = data.dhuhr;
            prayerTime.asr = data.asr;
            prayerTime.maghrib = data.maghrib;
            prayerTime.isha = data.isha;
            prayerTime.qiblaHour = data.qibla_hour || undefined;
          });
        }
      }
    });

    console.log(`✅ Bulk imported ${prayerTimesArray.length} prayer times`);
    return {imported: prayerTimesArray.length, failed: 0, errors: []};
  } catch (error) {
    console.error('❌ Error bulk importing prayer times:', error);
    throw error;
  }
};

/**
 * Observable prayer times for reactive UI
 */
export const observePrayerTimesForDate = (date: string) => {
  const prayerTimesCollection = database.get<PrayerTimesModel>('prayer_times');
  return prayerTimesCollection.query(Q.where('date', date)).observe();
};

/**
 * Observable all prayer times
 */
export const observeAllPrayerTimes = () => {
  const prayerTimesCollection = database.get<PrayerTimesModel>('prayer_times');
  return prayerTimesCollection.query(Q.sortBy('date', Q.desc)).observe();
};

/**
 * Import complete 2025 prayer times data
 */
export const import2025PrayerTimes = async () => {
  try {
    console.log('📥 Starting 2025 prayer times import...');

    // Sample prayer times data - replace with your actual data
    const sampleData = [
      {
        date: '2025-01-01',
        day: 'Wednesday',
        fajr: '04:39',
        shuruq: '05:52',
        dhuha: '06:22',
        dhuhr: '11:48',
        asr: '15:07',
        maghrib: '17:37',
        isha: '18:48',
        qibla_hour: null,
      },
      {
        date: '2025-01-06',
        day: 'Monday',
        fajr: '04:41',
        shuruq: '05:54',
        dhuha: '06:24',
        dhuhr: '11:50',
        asr: '15:09',
        maghrib: '17:40',
        isha: '18:50',
        qibla_hour: null,
      },
      // Add more sample data or load from external source
    ];

    const result = await bulkImportPrayerTimes(sampleData);
    console.log('✅ 2025 prayer times import completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error importing 2025 prayer times:', error);
    throw error;
  }
};
