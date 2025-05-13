import {initDatabase, closeDatabase, getDatabase} from './dbInitalizer';
import {
  savePrayerTimes,
  getPrayerTimes,
  getPrayerTimesRange,
} from './prayertimes_services';

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
};
