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
 * User preferences for prayer notifications - Enhanced
 */
export interface PrayerNotificationSettings {
  notifications: boolean;
  adhan_sound: string;
  calculation_method: string;
  reminder_minutes_before: number;
  // New fields for better control
  notification_types: {
    standard: boolean; // Regular notifications
    fullscreen: boolean; // Full screen notifications (fake call style)
    sound: boolean; // Sound enabled
    vibration: boolean; // Vibration enabled
  };
  prayer_specific: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  dnd_bypass: boolean; // Attempt to bypass Do Not Disturb
}

/**
 * Prayer completion status interface
 */
export interface PrayerCompletionStatus {
  completed: boolean;
  method?: 'jamath' | 'individual' | 'qaza';
  timestamp?: string;
}

/**
 * Daily task interfaces
 */
export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyTasksSummary {
  date: string;
  dayLabel: string;
  totalTasks: number;
  completedTasks: number;
  prayers: {
    fajr: PrayerCompletionStatus;
    dhuhr: PrayerCompletionStatus;
    asr: PrayerCompletionStatus;
    maghrib: PrayerCompletionStatus;
    isha: PrayerCompletionStatus;
  };
}
