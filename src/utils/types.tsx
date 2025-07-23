
export interface PrayerTimes {
  fajr: string;
  luhr: string;
  asr: string;
  magrib: string;
  isha: string;
}

export interface DateRange {
  from_date: string;
  to_date: string;
  times: PrayerTimes;
}

export interface MonthData {
  date_ranges: DateRange[];
}

export interface YearlyPrayerData {
  monthly_prayer_times: Record<string, MonthData>;
}

export interface PrayerNotification {
  id: string;
  prayer: string;
  originalTime: Date;
  notificationTime: Date;
  date: Date;
}

export type PrayerName = 'fajr' | 'luhr' | 'asr' | 'magrib' | 'isha';

