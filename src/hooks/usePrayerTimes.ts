import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  getPrayerTimesForDate,
  PrayerTimesData,
} from '../services/db/PrayerServices';
import {getTodayDateString} from '../utils/helpers';
import {dataCache} from '../utils/dataCache';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerWithMinutes {
  name: string;
  displayName: string;
  time: string;
  totalMinutes: number;
}

// Helper function to format time to 12-hour format without AM/PM suffix
const formatTo12HourTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const hrs = hours % 12 || 12; // Convert 0 to 12
  return `${hrs}:${minutes.toString().padStart(2, '0')}`;
};

export const usePrayerTimes = (date: string) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cachedPrayerTimesRef = useRef<PrayerWithMinutes[] | null>(null);
  const lastFetchDateRef = useRef<string>('');

  // Memoize prayer time conversion to avoid recalculation
  const convertPrayerTimes = useCallback(
    (dbData: PrayerTimesData): PrayerWithMinutes[] => {
      return [
        {
          name: 'fajr',
          displayName: 'Fajr',
          // use original 24h string; format display in UI
          time: dbData.fajr,
          totalMinutes: 0,
        },
        {
          name: 'dhuhr',
          displayName: 'Dhuhr',
          time: dbData.dhuhr,
          totalMinutes: 0,
        },
        {
          name: 'asr',
          displayName: 'Asr',
          time: dbData.asr,
          totalMinutes: 0,
        },
        {
          name: 'maghrib',
          displayName: 'Maghrib',
          time: dbData.maghrib,
          totalMinutes: 0,
        },
        {
          name: 'isha',
          displayName: 'Isha',
          time: dbData.isha,
          totalMinutes: 0,
        },
      ].map(prayer => {
        // Store original 24-hour format for calculations
        const originalTime =
          prayer.name === 'fajr'
            ? dbData.fajr
            : prayer.name === 'dhuhr'
            ? dbData.dhuhr
            : prayer.name === 'asr'
            ? dbData.asr
            : prayer.name === 'maghrib'
            ? dbData.maghrib
            : dbData.isha;

        const [hours, minutes] = originalTime.split(':').map(Number);
        return {
          ...prayer,
          totalMinutes: hours * 60 + minutes,
        };
      });
    },
    [],
  );

  // Optimized function to find active prayer using cached data
  const findActivePrayer = useCallback(
    (prayers: PrayerWithMinutes[]): PrayerTime[] => {
      const currentTime = new Date();
      const currentMinutes =
        currentTime.getHours() * 60 + currentTime.getMinutes();

      let activePrayerIndex = -1;
      let minDifference = Infinity;

      // Find the next prayer more efficiently
      for (let i = 0; i < prayers.length; i++) {
        const prayerTime = prayers[i].totalMinutes;
        const difference =
          prayerTime >= currentMinutes
            ? prayerTime - currentMinutes
            : prayerTime + 24 * 60 - currentMinutes;

        if (difference < minDifference) {
          minDifference = difference;
          activePrayerIndex = i;
        }
      }

      // Return only the necessary data
      return prayers.map((prayer, index) => ({
        name: prayer.name,
        displayName: prayer.displayName,
        time: prayer.time,
        isActive: index === activePrayerIndex,
      }));
    },
    [],
  );

  // Update active prayer status without refetching data
  const updateActivePrayer = useCallback(() => {
    if (cachedPrayerTimesRef.current) {
      const updatedPrayers = findActivePrayer(cachedPrayerTimesRef.current);
      setPrayerTimes(updatedPrayers);
    }
  }, [findActivePrayer]);
  // Fetch prayer times only when date changes
  const fetchPrayerTimes = useCallback(async () => {
    // Skip fetch if date hasn't changed
    if (lastFetchDateRef.current === date && cachedPrayerTimesRef.current) {
      updateActivePrayer();
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // Check cache first for faster loading
      const cacheKey = `prayer-times-${date}`;
      const cachedData = dataCache.get<PrayerTimesData>(cacheKey);
      if (cachedData) {
        console.log('🚀 Using cached prayer times for', date);
        const convertedPrayers = convertPrayerTimes(cachedData);
        cachedPrayerTimesRef.current = convertedPrayers;
        lastFetchDateRef.current = date;

        const prayersWithActive = findActivePrayer(convertedPrayers);
        setPrayerTimes(prayersWithActive);
        setIsLoading(false);
        return;
      }

      // Check for globally cached data first (from splash screen)
      const globalCachedData = (global as any).cachedTodayPrayerTimes;
      if (
        date === getTodayDateString() &&
        globalCachedData &&
        !cachedPrayerTimesRef.current
      ) {
        console.log('📦 Using cached prayer times from splash screen');
        const convertedPrayers = convertPrayerTimes(globalCachedData);
        cachedPrayerTimesRef.current = convertedPrayers;
        lastFetchDateRef.current = date;

        // Cache this data for future use
        dataCache.set(cacheKey, globalCachedData, 24 * 60 * 60 * 1000); // 24 hours

        const prayersWithActive = findActivePrayer(convertedPrayers);
        setPrayerTimes(prayersWithActive);
        setIsLoading(false);
        return;
      }
      const dbPrayerTimes = await getPrayerTimesForDate(date);

      if (dbPrayerTimes) {
        // Cache the fetched data
        dataCache.set(cacheKey, dbPrayerTimes, 24 * 60 * 60 * 1000); // 24 hours

        const convertedPrayers = convertPrayerTimes(dbPrayerTimes);
        cachedPrayerTimesRef.current = convertedPrayers;
        lastFetchDateRef.current = date;

        const prayersWithActive = findActivePrayer(convertedPrayers);
        setPrayerTimes(prayersWithActive);
      } else {
        setError('No prayer times found for this date');
        cachedPrayerTimesRef.current = null;
      }
    } catch (err) {
      setError('Failed to fetch prayer times');
      console.error('Error fetching prayer times:', err);
      cachedPrayerTimesRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [date, convertPrayerTimes, findActivePrayer, updateActivePrayer]);

  // Single effect to manage both fetching and interval
  useEffect(() => {
    fetchPrayerTimes();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval to update active prayer every minute (without refetching)
    intervalRef.current = setInterval(updateActivePrayer, 60000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchPrayerTimes, updateActivePrayer]);

  // Memoize the return value to prevent unnecessary re-renders
  const memoizedReturn = useMemo(
    () => ({
      prayerTimes,
      isLoading,
      error,
      refetch: fetchPrayerTimes,
    }),
    [prayerTimes, isLoading, error, fetchPrayerTimes],
  );

  return memoizedReturn;
};
