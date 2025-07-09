import {Model} from '@nozbe/watermelondb';
import {field, date, readonly, text} from '@nozbe/watermelondb/decorators';
import {getTodayDateString} from '../utils/helpers';

export type PrayerStatus =
  | 'none' // Explicitly marked as missed
  | 'home' // Prayed at home
  | 'mosque' // Prayed at mosque
  | null; // Not set yet (default state)

export default class DailyTasksModel extends Model {
  static table = 'daily_tasks';
  @text('date') date!: string;
  @text('fajr_status') fajrStatus!: string;
  @text('dhuhr_status') dhuhrStatus!: string;
  @text('asr_status') asrStatus!: string;
  @text('maghrib_status') maghribStatus!: string;
  @text('isha_status') ishaStatus!: string;
  @field('total_zikr_count') totalZikrCount!: number;
  @field('quran_minutes') quranMinutes!: number;
  @text('special_tasks') specialTasks!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get isToday(): boolean {
    const today = getTodayDateString();
    return this.date === today;
  }

  get completedPrayers(): number {
    const statuses = [
      this.fajrStatus,
      this.dhuhrStatus,
      this.asrStatus,
      this.maghribStatus,
      this.ishaStatus,
    ];
    return statuses.filter(status => status === 'home' || status === 'mosque')
      .length;
  }

  get totalTasks(): number {
    const specialTasksArray = this.specialTasks
      ? JSON.parse(this.specialTasks)
      : [];
    return 5 + specialTasksArray.length;
  }

  get completedTasks(): number {
    const specialTasksArray = this.specialTasks
      ? JSON.parse(this.specialTasks)
      : [];
    const completedSpecialTasks = specialTasksArray.filter(
      (task: any) => task.completed,
    ).length;

    return this.completedPrayers + completedSpecialTasks;
  }
}
