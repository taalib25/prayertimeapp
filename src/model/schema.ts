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
        {name: 'shuruq', type: 'string'},
        {name: 'dhuha', type: 'string'},
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
      name: 'prayer_tracking',
      columns: [
        {name: 'date', type: 'string', isIndexed: true},
        {name: 'prayer_name', type: 'string'},
        {name: 'completed', type: 'boolean'},
        {name: 'completion_type', type: 'string', isOptional: true},
        {name: 'completed_at', type: 'number', isOptional: true},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        {name: 'username', type: 'string'},
        {name: 'email', type: 'string', isOptional: true},
        {name: 'phone_number', type: 'string', isOptional: true},
        {name: 'location', type: 'string', isOptional: true},
        {name: 'masjid', type: 'string', isOptional: true},
        {name: 'prayer_settings', type: 'string'},
        {name: 'monthly_zikr_goal', type: 'number'},
        {name: 'monthly_quran_pages_goal', type: 'number'},
        {name: 'monthly_charity_goal', type: 'number'},
        {name: 'monthly_fasting_days_goal', type: 'number'},
        {name: 'preferred_madhab', type: 'string'},
        {name: 'app_language', type: 'string'},
        {name: 'theme', type: 'string'},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
  ],
});

export default prayerAppSchema;
