import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import PrayerTimesModel from '../../model/PrayerTimes';
import UserModel from '../../model/User';
import prayerAppSchema from '../../model/schema';
import DailyTasksModel from '../../model/DailyTasks';

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema: prayerAppSchema,
  dbName: 'prayer_app.db',
  migrations: {
    validated: true,
    minVersion: 1,
    maxVersion: 1,
    sortedMigrations: [],
  },
  jsi: false, 
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

// Then, make a Watermelon database from it:
const database = new Database({
  adapter,
  modelClasses: [PrayerTimesModel, DailyTasksModel, UserModel],
});

export default database;