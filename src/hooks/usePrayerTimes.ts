import {useState, useEffect} from 'react';
import {
  getPrayerTimesForDate,
  PrayerTimesData,
} from '../services/db/PrayerServices';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

export const usePrayerTimes = (date: string) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformPrayerTimes = (dbData: PrayerTimesData): PrayerTime[] => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const prayers = [
      {name: 'fajr', displayName: 'Fajr', time: dbData.fajr},
      {name: 'dhuhr', displayName: 'Dhuhr', time: dbData.dhuhr},
      {name: 'asr', displayName: 'Asr', time: dbData.asr},
      {name: 'maghrib', displayName: 'Maghrib', time: dbData.maghrib},
      {name: 'isha', displayName: 'Isha', time: dbData.isha},
    ];

    // Determine which prayer is currently active
    return prayers.map(prayer => {
      const [timeHour, timeMinute] = prayer.time.split(':').map(Number);
      const prayerMinutes = timeHour * 60 + timeMinute;
      const currentMinutes = currentHour * 60 + currentMinute;

      // Simple logic - you can make this more sophisticated
      const isActive = Math.abs(currentMinutes - prayerMinutes) < 30;

      return {
        ...prayer,
        isActive,
      };
    });
  };

  const fetchPrayerTimes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dbPrayerTimes = await getPrayerTimesForDate(date);

      if (dbPrayerTimes) {
        const transformed = transformPrayerTimes(dbPrayerTimes);
        setPrayerTimes(transformed);
      } else {
        setError('No prayer times found for this date');
      }
    } catch (err) {
      setError('Failed to fetch prayer times');
      console.error('Error fetching prayer times:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, [date]);

  return {prayerTimes, isLoading, error, refetch: fetchPrayerTimes};
};
