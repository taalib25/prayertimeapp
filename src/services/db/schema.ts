// model/schema.js
import {appSchema, tableSchema} from '@nozbe/watermelondb';

const prayerAppSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'prayer_times',
      columns: [
        {name: 'date', type: 'string', isIndexed: true},
        {name: 'day', type: 'string'},
        {name: 'fajr', type: 'string'},
        {name: 'dhuhr', type: 'string'},
        {name: 'asr', type: 'string'},
        {name: 'maghrib', type: 'string'},
        {name: 'isha', type: 'string'},
        {name: 'qibla_hour', type: 'string', isOptional: true},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: 'daily_tasks',
      columns: [
        {name: 'date', type: 'string', isIndexed: true},
        {name: 'fajr_status', type: 'string'},
        {name: 'dhuhr_status', type: 'string'},
        {name: 'asr_status', type: 'string'},
        {name: 'maghrib_status', type: 'string'},
        {name: 'isha_status', type: 'string'},
        {name: 'total_zikr_count', type: 'number'},
        {name: 'quran_minutes', type: 'number'},
        {name: 'special_tasks', type: 'string'},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
  ],
});

export default prayerAppSchema;
