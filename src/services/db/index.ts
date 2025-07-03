import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import PrayerTimesModel from '../../model/PrayerTimes';
import prayerAppSchema from './schema';
import DailyTasksModel from '../../model/DailyTasks';

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema: prayerAppSchema,
  dbName: 'prayer_app.db',
  jsi: false,
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

// Then, make a Watermelon database from it:
const database = new Database({
  adapter,
  modelClasses: [PrayerTimesModel, DailyTasksModel],
});

export default database;
