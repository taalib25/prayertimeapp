import {Model} from '@nozbe/watermelondb';
import {field, date, readonly} from '@nozbe/watermelondb/decorators';

export default class PrayerTrackingModel extends Model {
  static table = 'prayer_tracking';

  @field('date') date!: string;
  @field('prayer_name') prayerName!: string;
  @field('completed') completed!: boolean;
  @field('completion_type') completionType?: string;
  @field('completed_at') completedAt?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get isCompleted(): boolean {
    return this.completed;
  }

  get completedAtDate(): Date | null {
    return this.completedAt ? new Date(this.completedAt) : null;
  }
}
