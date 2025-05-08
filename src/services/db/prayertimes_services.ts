import {PrayerTimes} from '../../utils/types';
import {getDatabase} from './dbInitalizer';

/**
 * Save prayer times for a date
 */
export const savePrayerTimes = async (
  date: string,
  times: PrayerTimes,
): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.executeSql(
      `REPLACE INTO prayer_times 
       (date, fajr, sunrise, dhuhr, asr, maghrib, isha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        times.fajr,
        times.sunrise,
        times.dhuhr,
        times.asr,
        times.maghrib,
        times.isha,
      ],
    );

    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving prayer times:`, error);
    return Promise.reject(error);
  }
};

/**
 * Get prayer times for a date
 */
export const getPrayerTimes = async (
  date: string,
): Promise<PrayerTimes | null> => {
  try {
    const db = await getDatabase();

    const [results] = await db.executeSql(
      'SELECT * FROM prayer_times WHERE date = ?',
      [date],
    );

    if (results.rows.length > 0) {
      const row = results.rows.item(0);
      return {
        fajr: row.fajr,
        sunrise: row.sunrise,
        dhuhr: row.dhuhr,
        asr: row.asr,
        maghrib: row.maghrib,
        isha: row.isha,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting prayer times:`, error);
    return Promise.reject(error);
  }
};

/**
 * Get prayer times for a range of dates
 */
export const getPrayerTimesRange = async (
  startDate: string,
  endDate: string,
): Promise<Record<string, PrayerTimes>> => {
  try {
    const db = await getDatabase();

    const [results] = await db.executeSql(
      'SELECT * FROM prayer_times WHERE date >= ? AND date <= ?',
      [startDate, endDate],
    );

    const prayerTimes: Record<string, PrayerTimes> = {};
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      prayerTimes[row.date] = {
        fajr: row.fajr,
        sunrise: row.sunrise,
        dhuhr: row.dhuhr,
        asr: row.asr,
        maghrib: row.maghrib,
        isha: row.isha,
      };
    }

    return prayerTimes;
  } catch (error) {
    console.error(`Error getting prayer times range:`, error);
    return Promise.reject(error);
  }
};
