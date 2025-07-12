import {useMemo} from 'react';
import {useDailyTasks} from './useDailyTasks';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isEarned: boolean;
  category: string;
}

/**
 * Custom hook to calculate badges based on daily tasks data
 * Uses WatermelonDB data through enhanced useDailyTasks hook
 */
export const useBadgeCalculation = (): {
  badges: Badge[];
  earnedBadges: number;
  totalBadges: number;
} => {
  const {dailyTasks, updateTrigger} = useDailyTasks(90); // Get 90 days for badge calculations + reactive trigger

  const badges = useMemo(() => {
    // Calculate Challenge 40 badge (40+ consecutive Fajr at mosque)
    const fajrMosqueStreak = calculateFajrStreak(dailyTasks);
    const challenge40Earned = fajrMosqueStreak >= 40;

    // Calculate Zikr Star badge (200+ zikr count in a single day)
    const maxDailyZikrCount = Math.max(
      ...dailyTasks.map(task => task.totalZikrCount || 0),
      0,
    );
    const zikrStarEarned = maxDailyZikrCount >= 200;

    // Calculate Recite Master badge (30+ pages of Quran cumulative)
    // Assuming 15 minutes = 1 page
    const totalQuranPages = dailyTasks.reduce(
      (sum, task) => sum + Math.floor((task.quranMinutes || 0) / 15),
      0,
    );
    const reciteMasterEarned = totalQuranPages >= 30;

    console.log('🏆 Badge Calculation:', {
      fajrMosqueStreak,
      challenge40Earned,
      maxDailyZikrCount,
      zikrStarEarned,
      totalQuranPages,
      reciteMasterEarned,
      totalDailyTasks: dailyTasks.length,
      updateTrigger, // Log trigger for debugging
    });

    return [
      {
        id: '1',
        title: 'Challenge 40',
        description: 'Completed 40+ consecutive Fajr prayers at mosque',
        icon: 'mosque',
        isEarned: challenge40Earned,
        category: 'prayer',
      },
      {
        id: '2',
        title: 'Zikr Star',
        description: 'Completed 200+ zikr count in a single day',
        icon: 'prayer-beads',
        isEarned: zikrStarEarned,
        category: 'zikr',
      },
      {
        id: '3',
        title: 'Recite Master',
        description: 'Read 30+ pages of Quran (cumulative)',
        icon: 'quran',
        isEarned: reciteMasterEarned,
        category: 'quran',
      },
    ];
  }, [dailyTasks, updateTrigger]); // Add updateTrigger to dependencies

  const earnedBadges = badges.filter(badge => badge.isEarned).length;
  const totalBadges = badges.length;

  return {
    badges,
    earnedBadges,
    totalBadges,
  };
};

/**
 * Calculate the current Fajr streak (consecutive days with Fajr at mosque)
 * Goes backwards from today until it finds a day without mosque Fajr
 */
const calculateFajrStreak = (dailyTasks: any[]): number => {
  if (!dailyTasks || dailyTasks.length === 0) return 0;

  // Sort tasks by date in descending order (newest first)
  const sortedTasks = [...dailyTasks].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let streak = 0;

  // Count consecutive Fajr mosque prayers from today backwards
  for (const task of sortedTasks) {
    if (task.fajrStatus === 'mosque') {
      streak++;
    } else {
      // Break on first non-mosque day (including null, 'home', 'none')
      break;
    }
  }

  console.log('🕌 Fajr Streak Calculation:', {
    totalTasks: sortedTasks.length,
    calculatedStreak: streak,
    recentFajrStatuses: sortedTasks.slice(0, 10).map(t => ({
      date: t.date,
      fajrStatus: t.fajrStatus,
    })),
  });

  return streak;
};
