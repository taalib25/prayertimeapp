import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface UserProfile {
  username: string;
  email: string;
  phoneNumber: string;
}

interface UserData {
  id: number;
  profile: UserProfile;
  goals: UserGoals;
  settings: UserSettings;
}

const DEFAULT_GOALS: UserGoals = {
  monthlyZikrGoal: 100,
  monthlyQuranPagesGoal: 30,
  monthlyCharityGoal: 5,
  monthlyFastingDaysGoal: 6,
};

const DEFAULT_SETTINGS: UserSettings = {
  prayerSettings: 'standard',
  preferredMadhab: 'hanafi',
  appLanguage: 'en',
  theme: 'light',
};

export const useUser = ({uid}: UseUserProps) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStorageKey = (key: string) => `user_${uid}_${key}`;

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user data from AsyncStorage
      const [profileData, goalsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(getStorageKey('profile')),
        AsyncStorage.getItem(getStorageKey('goals')),
        AsyncStorage.getItem(getStorageKey('settings')),
      ]);

      const profile = profileData ? JSON.parse(profileData) : null;
      const goals = goalsData ? JSON.parse(goalsData) : DEFAULT_GOALS;
      const settings = settingsData
        ? JSON.parse(settingsData)
        : DEFAULT_SETTINGS;

      if (!profile) {
        setError('User profile not found');
        return;
      }

      setUser({
        id: uid,
        profile,
        goals,
        settings,
      });
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
        const currentGoals = user?.goals || DEFAULT_GOALS;
        const updatedGoals = {...currentGoals, ...goals};

        await AsyncStorage.setItem(
          getStorageKey('goals'),
          JSON.stringify(updatedGoals),
        );

        await fetchUser();
      } catch (err) {
        console.error('Error updating goals:', err);
        setError('Failed to update goals');
      }
    },
    [user, fetchUser, getStorageKey],
  );

  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      try {
        const currentSettings = user?.settings || DEFAULT_SETTINGS;
        const updatedSettings = {...currentSettings, ...settings};

        await AsyncStorage.setItem(
          getStorageKey('settings'),
          JSON.stringify(updatedSettings),
        );

        await fetchUser();
      } catch (err) {
        console.error('Error updating settings:', err);
        setError('Failed to update settings');
      }
    },
    [user, fetchUser, getStorageKey],
  );

  const updateProfile = useCallback(
    async (profile: Partial<UserProfile>) => {
      try {
        const currentProfile = user?.profile;
        if (!currentProfile) {
          throw new Error('No existing profile found');
        }

        const updatedProfile = {...currentProfile, ...profile};

        await AsyncStorage.setItem(
          getStorageKey('profile'),
          JSON.stringify(updatedProfile),
        );

        await fetchUser();
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
      }
    },
    [user, fetchUser, getStorageKey],
  );

  // Initialize user profile if it doesn't exist
  const initializeUser = useCallback(
    async (initialProfile: UserProfile) => {
      try {
        await Promise.all([
          AsyncStorage.setItem(
            getStorageKey('profile'),
            JSON.stringify(initialProfile),
          ),
          AsyncStorage.setItem(
            getStorageKey('goals'),
            JSON.stringify(DEFAULT_GOALS),
          ),
          AsyncStorage.setItem(
            getStorageKey('settings'),
            JSON.stringify(DEFAULT_SETTINGS),
          ),
        ]);

        await fetchUser();
      } catch (err) {
        console.error('Error initializing user:', err);
        setError('Failed to initialize user');
      }
    },
    [fetchUser, getStorageKey],
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
    initializeUser,
    refetch: fetchUser,
  };
};
