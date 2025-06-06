import {useState, useEffect, useCallback} from 'react';
import {
  getUserById,
  updateUserGoals,
  updateUserSettings,
  updateUserProfile,
  getMonthlyUserTotals,
  getUserPrayerStats,
  UserData,
} from '../services/db/UserServices';

interface UseUserProps {
  uid: number;
}

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

interface UserSettings {
  prayerSettings: string;
  preferredMadhab: string;
  appLanguage: string;
  theme: string;
  location?: string;
  masjid?: string;
}

export const useUser = ({uid}: UseUserProps) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = await getUserById(uid);
      setUser(userData);
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Error fetching user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  const updateGoals = useCallback(
    async (goals: Partial<UserGoals>) => {
      try {
        await updateUserGoals(uid, goals);
        await fetchUser(); // Refresh data
      } catch (err) {
        console.error('Error updating goals:', err);
        setError('Failed to update goals');
      }
    },
    [uid, fetchUser],
  );

  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      try {
        await updateUserSettings(uid, settings);
        await fetchUser(); // Refresh data
      } catch (err) {
        console.error('Error updating settings:', err);
        setError('Failed to update settings');
      }
    },
    [uid, fetchUser],
  );

  const updateProfile = useCallback(
    async (profile: {
      username?: string;
      email?: string;
      phoneNumber?: string;
    }) => {
      try {
        await updateUserProfile(uid, profile);
        await fetchUser(); // Refresh data
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
      }
    },
    [uid, fetchUser],
  );

  // Calculate monthly progress totals
  const getMonthlyTotals = useCallback(async () => {
    if (!user) return null;

    try {
      // Get current month's data
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const monthlyTotals = await getMonthlyUserTotals(uid, currentMonth);

      return {
        zikrProgress: {
          current: monthlyTotals.totalZikr,
          goal: user.monthlyZikrGoal,
          percentage: Math.round(
            (monthlyTotals.totalZikr / user.monthlyZikrGoal) * 100,
          ),
        },
        quranProgress: {
          current: monthlyTotals.totalQuranPages,
          goal: user.monthlyQuranPagesGoal,
          percentage: Math.round(
            (monthlyTotals.totalQuranPages / user.monthlyQuranPagesGoal) * 100,
          ),
        },
        charityProgress: {
          current: monthlyTotals.totalCharity,
          goal: user.monthlyCharityGoal,
          percentage: Math.round(
            (monthlyTotals.totalCharity / user.monthlyCharityGoal) * 100,
          ),
        },
        fastingProgress: {
          current: monthlyTotals.totalFastingDays,
          goal: user.monthlyFastingDaysGoal,
          percentage: Math.round(
            (monthlyTotals.totalFastingDays / user.monthlyFastingDaysGoal) *
              100,
          ),
        },
      };
    } catch (err) {
      console.error('Error calculating monthly totals:', err);
      return null;
    }
  }, [uid, user]);

  // Get prayer statistics
  const getPrayerStats = useCallback(
    async (period: 'week' | 'month' | 'year' = 'month') => {
      try {
        const stats = await getUserPrayerStats(uid, period);
        return {
          fajrPercentage: Math.round(
            (stats.fajrCompleted / stats.totalDays) * 100,
          ),
          dhuhrPercentage: Math.round(
            (stats.dhuhrCompleted / stats.totalDays) * 100,
          ),
          asrPercentage: Math.round(
            (stats.asrCompleted / stats.totalDays) * 100,
          ),
          maghribPercentage: Math.round(
            (stats.maghribCompleted / stats.totalDays) * 100,
          ),
          ishaPercentage: Math.round(
            (stats.ishaCompleted / stats.totalDays) * 100,
          ),
          overallPercentage: Math.round(
            (stats.totalCompleted / (stats.totalDays * 5)) * 100,
          ),
        };
      } catch (err) {
        console.error('Error getting prayer stats:', err);
        return null;
      }
    },
    [uid],
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    updateGoals,
    updateSettings,
    updateProfile,
    getMonthlyTotals,
    getPrayerStats,
    refetch: fetchUser,
  };
};
