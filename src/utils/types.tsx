import {Observable} from 'rxjs';
import PrayerTimesModel from '../model/PrayerTimes';

/**
 * Prayer times interface - updated for WatermelonDB compatibility
 */
export interface PrayerTimes {
  fajr: string;
  sunrise: string; // Maps to shuruq in database
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

/**
 * Extended prayer times interface matching database schema
 */
export interface ExtendedPrayerTimes {
  date: string;
  day: string;
  fajr: string;
  shuruq: string; // sunrise
  dhuha: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  qibla_hour?: string;
}

/**
 * Observable prayer times for reactive components
 */
export type PrayerTimesObservable = Observable<PrayerTimesModel[]>;

/**
 * Prayer tracking status
 */
export interface PrayerStatus {
  name: string;
  displayName: string;
  time: string;
  isCompleted: boolean;
  completionType?: 'jamath' | 'individual' | 'qaza';
  isActive: boolean;
}

/**
 * User preferences for prayer notifications
 */
export interface PrayerNotificationSettings {
  notifications: boolean;
  adhan_sound: string;
  calculation_method: string;
  reminder_minutes_before: number;
}
