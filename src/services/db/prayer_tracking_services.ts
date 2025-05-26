import {getDatabase} from './dbInitalizer';

export interface PrayerTracking {
  id?: number;
  date: string; // YYYY-MM-DD
  prayer_name: string; // 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'
  completed: boolean;
  completion_type?: 'jamaath' | 'home' | 'late'; // How the prayer was performed
  completed_at?: string; // ISO timestamp when marked complete
}

export interface DayPrayerStatus {
  date: string;
  prayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  completedCount: number;
  totalCount: number;
}

/**
 * Save or update prayer tracking status
 */
export const updatePrayerTracking = async (
  date: string,
  prayerName: string,
  completed: boolean,
  completionType?: 'jamaath' | 'home' | 'late'
): Promise<void> => {
  try {
    const db = await getDatabase();
    
    const completedAt = completed ? new Date().toISOString() : null;
    
    await db.executeSql(
      `REPLACE INTO prayer_tracking 
       (date, prayer_name, completed, completion_type, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [date, prayerName, completed ? 1 : 0, completionType || null, completedAt]
    );
  } catch (error) {
    console.error('Error updating prayer tracking:', error);
    return Promise.reject(error);
  }
};

/**
 * Get prayer tracking status for a specific date
 */
export const getPrayerTrackingForDate = async (
  date: string
): Promise<DayPrayerStatus> => {
  try {
    const db = await getDatabase();
    
    const [results] = await db.executeSql(
      'SELECT * FROM prayer_tracking WHERE date = ?',
      [date]
    );
    
    const prayers = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      if (row.prayer_name in prayers) {
        prayers[row.prayer_name as keyof typeof prayers] = Boolean(row.completed);
      }
    }
    
    const completedCount = Object.values(prayers).filter(Boolean).length;
    
    return {
      date,
      prayers,
      completedCount,
      totalCount: 5,
    };
  } catch (error) {
    console.error('Error getting prayer tracking for date:', error);
    return Promise.reject(error);
  }
};

/**
 * Get prayer tracking for a date range
 */
export const getPrayerTrackingRange = async (
  startDate: string,
  endDate: string
): Promise<Record<string, DayPrayerStatus>> => {
  try {
    const db = await getDatabase();
    
    const [results] = await db.executeSql(
      'SELECT * FROM prayer_tracking WHERE date >= ? AND date <= ?',
      [startDate, endDate]
    );
    
    const trackingData: Record<string, DayPrayerStatus> = {};
    
    // Group by date
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      const date = row.date;
      
      if (!trackingData[date]) {
        trackingData[date] = {
          date,
          prayers: {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
          },
          completedCount: 0,
          totalCount: 5,
        };
      }
      
      if (row.prayer_name in trackingData[date].prayers) {
        trackingData[date].prayers[row.prayer_name as keyof typeof trackingData[typeof date]['prayers']] = Boolean(row.completed);
      }
    }
    
    // Calculate completed counts
    Object.values(trackingData).forEach(dayStatus => {
      dayStatus.completedCount = Object.values(dayStatus.prayers).filter(Boolean).length;
    });
    
    return trackingData;
  } catch (error) {
    console.error('Error getting prayer tracking range:', error);
    return Promise.reject(error);
  }
};

/**
 * Get prayer streak (consecutive days with all prayers completed)
 */
export const getPrayerStreak = async (): Promise<number> => {
  try {
    // Get last 30 days of data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const trackingData = await getPrayerTrackingRange(startDate, endDate);
    
    let streak = 0;
    const currentDate = new Date();
    
    // Count backwards from today
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayData = trackingData[dateStr];
      if (dayData && dayData.completedCount === 5) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating prayer streak:', error);
    return 0;
  }
};
