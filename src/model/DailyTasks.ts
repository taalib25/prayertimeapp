import {Model} from '@nozbe/watermelondb';
import {field, date, readonly} from '@nozbe/watermelondb/decorators';

export type PrayerStatus =
  | 'pending'
  | 'completed'
  | 'missed'
  | 'jamath'
  | 'individual'
  | 'qaza';

export default class DailyTasksModel extends Model {
  static table = 'daily_tasks';

  @field('uid') uid!: number;
  @field('date') date!: string;
  @field('fajr_status') fajrStatus!: string;
  @field('dhuhr_status') dhuhrStatus!: string;
  @field('asr_status') asrStatus!: string;
  @field('maghrib_status') maghribStatus!: string;
  @field('isha_status') ishaStatus!: string;
  @field('tahajjud_completed') tahajjudCompleted!: boolean;
  @field('duha_completed') duhaCompleted!: boolean;
  @field('total_zikr_count') totalZikrCount!: number;
  @field('quran_minutes') quranMinutes!: number;
  @field('quran_pages_read') quranPagesRead!: number;
  @field('special_tasks') specialTasks!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  getPrayerStatus(prayerName: string): PrayerStatus {
    switch (prayerName.toLowerCase()) {
      case 'fajr':
        return this.fajrStatus as PrayerStatus;
      case 'dhuhr':
        return this.dhuhrStatus as PrayerStatus;
      case 'asr':
        return this.asrStatus as PrayerStatus;
      case 'maghrib':
        return this.maghribStatus as PrayerStatus;
      case 'isha':
        return this.ishaStatus as PrayerStatus;
      default:
        return 'pending';
    }
  }

  get completedPrayers(): number {
    const statuses = [
      this.fajrStatus,
      this.dhuhrStatus,
      this.asrStatus,
      this.maghribStatus,
      this.ishaStatus,
    ];
    return statuses.filter(
      status =>
        status === 'completed' ||
        status === 'jamath' ||
        status === 'individual',
    ).length;
  }

  get totalTasks(): number {
    const specialTasksArray = this.specialTasks
      ? JSON.parse(this.specialTasks)
      : [];
    return (
      5 +
      (this.tahajjudCompleted ? 1 : 0) +
      (this.duhaCompleted ? 1 : 0) +
      specialTasksArray.length
    );
  }

  get completedTasks(): number {
    const specialTasksArray = this.specialTasks
      ? JSON.parse(this.specialTasks)
      : [];
    const completedSpecialTasks = specialTasksArray.filter(
      (task: any) => task.completed,
    ).length;

    return (
      this.completedPrayers +
      (this.tahajjudCompleted ? 1 : 0) +
      (this.duhaCompleted ? 1 : 0) +
      completedSpecialTasks
    );
  }
}
