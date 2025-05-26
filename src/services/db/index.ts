import {initDatabase, closeDatabase, getDatabase} from './dbInitalizer';
import {
  savePrayerTimes,
  getPrayerTimes,
  getPrayerTimesRange,
} from './prayertimes_services';
import {
  updatePrayerTracking,
  getPrayerTrackingForDate,
  getPrayerTrackingRange,
  getPrayerStreak,
} from './prayer_tracking_services';

// Re-export everything for easy imports
export {
  // Core database operations
  initDatabase,
  closeDatabase,
  getDatabase, // Export getDatabase

  // Prayer times operations
  savePrayerTimes,
  getPrayerTimes,
  getPrayerTimesRange,

  // Prayer tracking operations
  updatePrayerTracking,
  getPrayerTrackingForDate,
  getPrayerTrackingRange,
  getPrayerStreak,
};
