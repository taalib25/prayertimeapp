export interface PrayerTimes {
  id?: number; // Optional: if your DB table has an auto-incrementing ID
  date: string; // YYYY-MM-DD
  fajr: string; // HH:MM
  sunrise: string; // HH:MM
  dhuhr: string; // HH:MM
  asr: string; // HH:MM
  maghrib: string; // HH:MM
  isha: string; // HH:MM
  [key: string]: string | number | undefined; // For dynamic access in PrayerTimeScreen
}
