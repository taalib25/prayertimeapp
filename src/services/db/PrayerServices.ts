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
    console.log(`📅 Found range start date: ${startPrayerTime.date}`);

    // Find the end date of the range (next date after start date)
    const endMatches = await prayerTimesCollection
      .query(
        Q.where('date', Q.gt(startPrayerTime.date)),
        Q.sortBy('date', Q.asc),
        Q.take(1),
      )
      .fetch();

    const endDate = endMatches.length > 0 ? endMatches[0].date : null;
    console.log(`📅 Range end date: ${endDate || 'no end (ongoing)'}`);

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

    // Placeholder implementation - replace with actual data
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
        date: '2025-04-11',
        day: 'Friday',
        fajr: '4:26',
        shuruq: '5:34',
        dhuha: '5:57',
        dhuhr: '11:45',
        asr: '14:48',
        maghrib: '17:51',
        isha: '18:57',
        qibla_hour: '11:53',
      },
      {
        date: '2025-04-16',
        day: 'Wednesday',
        fajr: '4:23',
        shuruq: '5:32',
        dhuha: '5:55',
        dhuhr: '11:44',
        asr: '14:50',
        maghrib: '17:50',
        isha: '18:57',
        qibla_hour: '12:08',
      },
      {
        date: '2025-04-21',
        day: 'Monday',
        fajr: '4:20',
        shuruq: '5:30',
        dhuha: '5:54',
        dhuhr: '11:43',
        asr: '14:52',
        maghrib: '17:50',
        isha: '18:57',
        qibla_hour: '12:24',
      },
      {
        date: '2025-04-26',
        day: 'Saturday',
        fajr: '4:18',
        shuruq: '5:28',
        dhuha: '5:52',
        dhuhr: '11:42',
        asr: '14:54',
        maghrib: '17:50',
        isha: '18:58',
        qibla_hour: '12:39',
      },
      {
        date: '2025-05-01',
        day: 'Thursday',
        fajr: '4:16',
        shuruq: '5:26',
        dhuha: '5:51',
        dhuhr: '11:41',
        asr: '14:56',
        maghrib: '17:50',
        isha: '18:58',
        qibla_hour: '12:55',
      },
      {
        date: '2025-05-06',
        day: 'Tuesday',
        fajr: '4:14',
        shuruq: '5:25',
        dhuha: '5:49',
        dhuhr: '11:41',
        asr: '14:58',
        maghrib: '17:51',
        isha: '18:59',
        qibla_hour: '13:11',
      },
      {
        date: '2025-05-11',
        day: 'Sunday',
        fajr: '4:13',
        shuruq: '5:24',
        dhuha: '5:49',
        dhuhr: '11:41',
        asr: '14:59',
        maghrib: '17:51',
        isha: '19:00',
        qibla_hour: '13:27',
      },
      {
        date: '2025-05-16',
        day: 'Friday',
        fajr: '4:11',
        shuruq: '5:23',
        dhuha: '5:48',
        dhuhr: '11:40',
        asr: '15:01',
        maghrib: '17:52',
        isha: '19:01',
        qibla_hour: '13:43',
      },
      {
        date: '2025-05-21',
        day: 'Wednesday',
        fajr: '4:10',
        shuruq: '5:23',
        dhuha: '5:48',
        dhuhr: '11:41',
        asr: '15:02',
        maghrib: '17:53',
        isha: '19:03',
        qibla_hour: '13:58',
      },
      {
        date: '2025-05-26',
        day: 'Monday',
        fajr: '4:10',
        shuruq: '5:23',
        dhuha: '5:48',
        dhuhr: '11:41',
        asr: '15:04',
        maghrib: '17:54',
        isha: '19:04',
        qibla_hour: '14:13',
      },
      {
        date: '2025-05-31',
        day: 'Saturday',
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
        date: '2025-06-01',
        day: 'Sunday',
        fajr: '4:09',
        shuruq: '5:23',
        dhuha: '5:48',
        dhuhr: '11:42',
        asr: '15:06',
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
      {
        date: '2025-06-11',
        day: 'Wednesday',
        fajr: '4:10',
        shuruq: '5:24',
        dhuha: '5:50',
        dhuhr: '11:44',
        asr: '15:09',
        maghrib: '17:57',
        isha: '19:09',
        qibla_hour: '14:51',
      },
      {
        date: '2025-06-16',
        day: 'Monday',
        fajr: '4:11',
        shuruq: '5:25',
        dhuha: '5:51',
        dhuhr: '11:45',
        asr: '15:10',
        maghrib: '17:58',
        isha: '19:10',
        qibla_hour: '14:58',
      },
      {
        date: '2025-06-21',
        day: 'Saturday',
        fajr: '4:12',
        shuruq: '5:26',
        dhuha: '5:52',
        dhuhr: '11:46',
        asr: '15:11',
        maghrib: '18:00',
        isha: '19:12',
        qibla_hour: '15:02',
      },
      {
        date: '2025-06-26',
        day: 'Thursday',
        fajr: '4:13',
        shuruq: '5:27',
        dhuha: '5:53',
        dhuhr: '11:47',
        asr: '15:12',
        maghrib: '18:01',
        isha: '19:13',
        qibla_hour: '15:02',
      },
      {
        date: '2025-07-01',
        day: 'Tuesday',
        fajr: '4:14',
        shuruq: '5:28',
        dhuha: '5:54',
        dhuhr: '11:48',
        asr: '15:13',
        maghrib: '18:02',
        isha: '19:13',
        qibla_hour: '14:56',
      },
      {
        date: '2025-07-06',
        day: 'Sunday',
        fajr: '4:16',
        shuruq: '5:30',
        dhuha: '5:55',
        dhuhr: '11:49',
        asr: '15:13',
        maghrib: '18:02',
        isha: '19:14',
        qibla_hour: '14:49',
      },
      {
        date: '2025-07-11',
        day: 'Friday',
        fajr: '4:17',
        shuruq: '5:31',
        dhuha: '5:56',
        dhuhr: '11:50',
        asr: '15:14',
        maghrib: '18:03',
        isha: '19:14',
        qibla_hour: '14:38',
      },
      {
        date: '2025-07-16',
        day: 'Wednesday',
        fajr: '4:18',
        shuruq: '5:32',
        dhuha: '5:57',
        dhuhr: '11:50',
        asr: '15:13',
        maghrib: '18:03',
        isha: '19:14',
        qibla_hour: '14:25',
      },
      {
        date: '2025-07-21',
        day: 'Monday',
        fajr: '4:20',
        shuruq: '5:33',
        dhuha: '5:57',
        dhuhr: '11:51',
        asr: '15:13',
        maghrib: '18:03',
        isha: '19:13',
        qibla_hour: '14:12',
      },
      {
        date: '2025-07-26',
        day: 'Saturday',
        fajr: '4:21',
        shuruq: '5:33',
        dhuha: '5:58',
        dhuhr: '11:51',
        asr: '15:11',
        maghrib: '18:02',
        isha: '19:12',
        qibla_hour: '13:57',
      },
      {
        date: '2025-07-31',
        day: 'Thursday',
        fajr: '4:22',
        shuruq: '5:34',
        dhuha: '5:58',
        dhuhr: '11:51',
        asr: '15:10',
        maghrib: '18:01',
        isha: '19:11',
        qibla_hour: '13:42',
      },
      {
        date: '2025-08-01',
        day: 'Friday',
        fajr: '4:22',
        shuruq: '5:34',
        dhuha: '5:58',
        dhuhr: '11:50',
        asr: '15:09',
        maghrib: '18:01',
        isha: '19:10',
        qibla_hour: '13:41',
      },
      {
        date: '2025-08-06',
        day: 'Wednesday',
        fajr: '4:23',
        shuruq: '5:34',
        dhuha: '5:59',
        dhuhr: '11:50',
        asr: '15:07',
        maghrib: '18:00',
        isha: '19:09',
        qibla_hour: '13:25',
      },
      {
        date: '2025-08-11',
        day: 'Monday',
        fajr: '4:24',
        shuruq: '5:34',
        dhuha: '5:59',
        dhuhr: '11:49',
        asr: '15:04',
        maghrib: '17:58',
        isha: '19:07',
        qibla_hour: '13:08',
      },
      {
        date: '2025-08-16',
        day: 'Saturday',
        fajr: '4:24',
        shuruq: '5:34',
        dhuha: '5:58',
        dhuhr: '11:48',
        asr: '15:01',
        maghrib: '17:57',
        isha: '19:04',
        qibla_hour: '12:50',
      },
      {
        date: '2025-08-21',
        day: 'Thursday',
        fajr: '4:25',
        shuruq: '5:34',
        dhuha: '5:58',
        dhuhr: '11:47',
        asr: '14:57',
        maghrib: '17:55',
        isha: '19:02',
        qibla_hour: '12:33',
      },
      {
        date: '2025-08-26',
        day: 'Tuesday',
        fajr: '4:25',
        shuruq: '5:33',
        dhuha: '5:57',
        dhuhr: '11:46',
        asr: '14:53',
        maghrib: '17:53',
        isha: '18:59',
        qibla_hour: '12:16',
      },
      {
        date: '2025-08-31',
        day: 'Sunday',
        fajr: '4:25',
        shuruq: '5:33',
        dhuha: '5:57',
        dhuhr: '11:45',
        asr: '14:48',
        maghrib: '17:50',
        isha: '18:56',
        qibla_hour: '11:58',
      },
      {
        date: '2025-09-01',
        day: 'Monday',
        fajr: '4:25',
        shuruq: '5:33',
        dhuha: '5:56',
        dhuhr: '11:44',
        asr: '14:46',
        maghrib: '17:50',
        isha: '18:56',
        qibla_hour: '11:54',
      },
      {
        date: '2025-09-06',
        day: 'Saturday',
        fajr: '4:24',
        shuruq: '5:32',
        dhuha: '5:56',
        dhuhr: '11:43',
        asr: '14:43',
        maghrib: '17:47',
        isha: '18:53',
        qibla_hour: null,
      },
      {
        date: '2025-09-11',
        day: 'Thursday',
        fajr: '4:24',
        shuruq: '5:31',
        dhuha: '5:55',
        dhuhr: '11:41',
        asr: '14:44',
        maghrib: '17:44',
        isha: '18:50',
        qibla_hour: '11:19',
      },
      {
        date: '2025-09-16',
        day: 'Tuesday',
        fajr: '4:23',
        shuruq: '5:30',
        dhuha: '5:54',
        dhuhr: '11:39',
        asr: '14:45',
        maghrib: '17:42',
        isha: '18:47',
        qibla_hour: '11:01',
      },
      {
        date: '2025-09-21',
        day: 'Sunday',
        fajr: '4:22',
        shuruq: '5:30',
        dhuha: '5:53',
        dhuhr: '11:37',
        asr: '14:46',
        maghrib: '17:39',
        isha: '18:44',
        qibla_hour: '10:43',
      },
      {
        date: '2025-09-26',
        day: 'Friday',
        fajr: '4:22',
        shuruq: '5:29',
        dhuha: '5:52',
        dhuhr: '11:36',
        asr: '14:47',
        maghrib: '17:36',
        isha: '18:41',
        qibla_hour: '10:24',
      },
      {
        date: '2025-10-01',
        day: 'Wednesday',
        fajr: '4:21',
        shuruq: '5:28',
        dhuha: '5:52',
        dhuhr: '11:34',
        asr: '14:47',
        maghrib: '17:34',
        isha: '18:39',
        qibla_hour: '10:07',
      },
      {
        date: '2025-10-06',
        day: 'Monday',
        fajr: '4:20',
        shuruq: '5:27',
        dhuha: '5:51',
        dhuhr: '11:32',
        asr: '14:47',
        maghrib: '17:31',
        isha: '18:36',
        qibla_hour: '9:49',
      },
      {
        date: '2025-10-11',
        day: 'Saturday',
        fajr: '4:19',
        shuruq: '5:27',
        dhuha: '5:51',
        dhuhr: '11:31',
        asr: '14:47',
        maghrib: '17:29',
        isha: '18:34',
        qibla_hour: '9:31',
      },
      {
        date: '2025-10-16',
        day: 'Thursday',
        fajr: '4:19',
        shuruq: '5:27',
        dhuha: '5:50',
        dhuhr: '11:30',
        asr: '14:47',
        maghrib: '17:27',
        isha: '18:33',
        qibla_hour: '9:14',
      },
      {
        date: '2025-10-21',
        day: 'Tuesday',
        fajr: '4:18',
        shuruq: '5:27',
        dhuha: '5:51',
        dhuhr: '11:29',
        asr: '14:47',
        maghrib: '17:25',
        isha: '18:31',
        qibla_hour: '8:56',
      },
      {
        date: '2025-10-26',
        day: 'Sunday',
        fajr: '4:18',
        shuruq: '5:27',
        dhuha: '5:51',
        dhuhr: '11:28',
        asr: '14:47',
        maghrib: '17:23',
        isha: '18:30',
        qibla_hour: '8:38',
      },
      {
        date: '2025-10-31',
        day: 'Friday',
        fajr: '4:18',
        shuruq: '5:27',
        dhuha: '5:51',
        dhuhr: '11:28',
        asr: '14:47',
        maghrib: '17:22',
        isha: '18:29',
        qibla_hour: '8:21',
      },
      {
        date: '2025-11-01',
        day: 'Saturday',
        fajr: '4:18',
        shuruq: '5:27',
        dhuha: '5:52',
        dhuhr: '11:28',
        asr: '14:47',
        maghrib: '17:22',
        isha: '18:29',
        qibla_hour: '8:21',
      },
      {
        date: '2025-11-06',
        day: 'Thursday',
        fajr: '4:19',
        shuruq: '5:28',
        dhuha: '5:53',
        dhuhr: '11:28',
        asr: '14:47',
        maghrib: '17:21',
        isha: '18:29',
        qibla_hour: '8:04',
      },
      {
        date: '2025-11-11',
        day: 'Tuesday',
        fajr: '4:19',
        shuruq: '5:29',
        dhuha: '5:54',
        dhuhr: '11:28',
        asr: '14:48',
        maghrib: '17:21',
        isha: '18:29',
        qibla_hour: '7:48',
      },
      {
        date: '2025-11-16',
        day: 'Sunday',
        fajr: '4:20',
        shuruq: '5:31',
        dhuha: '5:55',
        dhuhr: '11:29',
        asr: '14:49',
        maghrib: '17:21',
        isha: '18:29',
        qibla_hour: '7:32',
      },
      {
        date: '2025-11-21',
        day: 'Friday',
        fajr: '4:21',
        shuruq: '5:32',
        dhuha: '5:57',
        dhuhr: '11:30',
        asr: '14:50',
        maghrib: '17:21',
        isha: '18:30',
        qibla_hour: '7:17',
      },
      {
        date: '2025-11-26',
        day: 'Wednesday',
        fajr: '4:23',
        shuruq: '5:34',
        dhuha: '5:59',
        dhuhr: '11:31',
        asr: '14:51',
        maghrib: '17:22',
        isha: '18:32',
        qibla_hour: '7:02',
      },
      {
        date: '2025-12-01',
        day: 'Monday',
        fajr: '4:24',
        shuruq: '5:37',
        dhuha: '6:02',
        dhuhr: '11:33',
        asr: '14:53',
        maghrib: '17:24',
        isha: '18:33',
        qibla_hour: '6:46',
      },
      {
        date: '2025-12-06',
        day: 'Saturday',
        fajr: '4:26',
        shuruq: '5:39',
        dhuha: '6:04',
        dhuhr: '11:35',
        asr: '14:55',
        maghrib: '17:25',
        isha: '18:35',
        qibla_hour: '6:35',
      },
      {
        date: '2025-12-11',
        day: 'Thursday',
        fajr: '4:29',
        shuruq: '5:41',
        dhuha: '6:07',
        dhuhr: '11:37',
        asr: '14:57',
        maghrib: '17:27',
        isha: '18:37',
        qibla_hour: '6:26',
      },
      {
        date: '2025-12-16',
        day: 'Tuesday',
        fajr: '4:31',
        shuruq: '5:44',
        dhuha: '6:09',
        dhuhr: '11:40',
        asr: '14:59',
        maghrib: '17:29',
        isha: '18:40',
        qibla_hour: '6:21',
      },
      {
        date: '2025-12-21',
        day: 'Sunday',
        fajr: '4:33',
        shuruq: '5:46',
        dhuha: '6:12',
        dhuhr: '11:42',
        asr: '15:01',
        maghrib: '17:32',
        isha: '18:42',
        qibla_hour: '6:20',
      },
      {
        date: '2025-12-26',
        day: 'Friday',
        fajr: '4:36',
        shuruq: '5:49',
        dhuha: '6:14',
        dhuhr: '11:45',
        asr: '15:04',
        maghrib: '17:34',
        isha: '18:45',
        qibla_hour: '6:23',
      },
      {
        date: '2025-12-31',
        day: 'Wednesday',
        fajr: '4:38',
        shuruq: '5:51',
        dhuha: '6:17',
        dhuhr: '11:47',
        asr: '15:06',
        maghrib: '17:37',
        isha: '18:47',
        qibla_hour: '6:31',
      },
    ];

    const result = await bulkImportPrayerTimes(sampleData);
    console.log('✅ 2025 prayer times import completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error importing 2025 prayer times:', error);
    throw error;
  }
};
