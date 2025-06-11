import {Model} from '@nozbe/watermelondb';
import {field, date, readonly} from '@nozbe/watermelondb/decorators';

export default class UserModel extends Model {
  static table = 'users';

  @field('uid') uid!: number;
  @field('username') username!: string;
  @field('email') email?: string;
  @field('phone_number') phoneNumber?: string;
  @field('location') location?: string;
  @field('masjid') masjid?: string;
  @field('prayer_settings') prayerSettings!: string;
  @field('monthly_zikr_goal') monthlyZikrGoal!: number;
  @field('monthly_quran_pages_goal') monthlyQuranPagesGoal!: number;
  @field('monthly_charity_goal') monthlyCharityGoal!: number;
  @field('monthly_fasting_days_goal') monthlyFastingDaysGoal!: number;
  @field('preferred_madhab') preferredMadhab!: string;
  @field('app_language') appLanguage!: string;
  @field('theme') theme!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
