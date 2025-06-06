import {useState, useEffect, useCallback} from 'react';
import {
  getUserById,
  updateUserGoals,
  updateUserSettings,
  updateUserProfile,
  initializeDummyUsersIfNeeded,
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

      console.log('Fetching user with uid:', uid);

      // Initialize dummy users if database is empty
      await initializeDummyUsersIfNeeded();

      const userData = await getUserById(uid);
      console.log('Fetched User Data:', userData);

      if (!userData) {
        console.log('No user found with uid:', uid);
        setError('User not found');
      } else {
        setUser(userData);
      }
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
        await fetchUser();
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
      }
    },
    [uid, fetchUser],
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
    refetch: fetchUser,
  };
};
