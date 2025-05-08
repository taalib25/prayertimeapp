import {initDatabase, closeDatabase} from './dbInitalizer';
import {
  savePrayerTimes,
  getPrayerTimes,
  getPrayerTimesRange,
} from './prayertimes_services';
import {saveSetting, getSetting, getSettings} from './settings_services';

// Re-export everything for easy imports
export {
  // Core database operations
  initDatabase,
  closeDatabase,

  // Settings operations
  saveSetting,
  getSetting,
  getSettings,

  // Prayer times operations
  savePrayerTimes,
  getPrayerTimes,
  getPrayerTimesRange,
};
