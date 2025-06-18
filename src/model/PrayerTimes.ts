import {Model} from '@nozbe/watermelondb';
import {field, date, readonly} from '@nozbe/watermelondb/decorators';

export default class PrayerTimesModel extends Model {
  static table = 'prayer_times';

  @field('date') date!: string;
  @field('day') day!: string;
  @field('fajr') fajr!: string;
  @field('dhuhr') dhuhr!: string;
  @field('asr') asr!: string;
  @field('maghrib') maghrib!: string;
  @field('isha') isha!: string;
  @field('qibla_hour') qiblaHour?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper method to get prayer time by name
  getPrayerTime(prayerName: string): string {
    switch (prayerName.toLowerCase()) {
      case 'fajr':
        return this.fajr;
      case 'dhuhr':
        return this.dhuhr;
      case 'asr':
        return this.asr;
      case 'maghrib':
        return this.maghrib;
      case 'isha':
        return this.isha;
      default:
        return '';
    }
  }

  // Check if prayer times are for today
  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }
}
