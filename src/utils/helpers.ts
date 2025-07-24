import { PrayerName } from "./types";

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
  const day = tomorrow.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const PRAYER_NAMES = ['fajr','luhr','asr','magrib','isha'];
export const ADVANCE_WARNING_MINUTES = 15;

export const NOTIFICATION_CHANNEL = {
  PRAYER_REMINDERS: 'prayer-reminders',
  PRAYER_SYSTEM:    'prayer-system'
};


export const NOTIFICATION_CHANNELS = {
  PRAYER_REMINDERS: 'prayer-reminders',
  PRAYER_SYSTEM: 'prayer-system',
} as const;

export const MONTH_NAMES: Record<string, number> = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  luhr: 'Dhuhr',
  asr: 'Asr',
  magrib: 'Maghrib',
  isha: 'Isha',
};


export const parseDate = (dateStr: string, year: number): Date => {
  const [day, month] = dateStr.split('-');
  return new Date(year, MONTH_NAMES[month], parseInt(day, 10));
};

export const createPrayerDateTime = (baseDate: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dateTime = new Date(baseDate);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
