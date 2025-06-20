import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

export interface UserSettings {
  prayerSettings: string;
  preferredMadhab: string;
  appLanguage: string;
  theme: string;
  location?: string;
  masjid?: string;
}

export interface UserProfile {
  username: string;
  email: string;
  phoneNumber: string;
}

export interface UserData {
  id: number;
  profile: UserProfile;
  goals: UserGoals;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_GOALS: UserGoals = {
  monthlyZikrGoal: 600,
  monthlyQuranPagesGoal: 300,
  monthlyCharityGoal: 100,
  monthlyFastingDaysGoal: 15,
};

const DEFAULT_SETTINGS: UserSettings = {
  prayerSettings: JSON.stringify({
    method: 'ISNA',
    notifications: true,
    sound: 'adhan1',
  }),
  preferredMadhab: 'Hanafi',
  appLanguage: 'en',
  theme: 'light',
};

const getStorageKey = (uid: number, key: string) => `user_${uid}_${key}`;

export const getUserById = async (uid: number): Promise<UserData | null> => {
  try {
    const [profileData, goalsData, settingsData] = await Promise.all([
      AsyncStorage.getItem(getStorageKey(uid, 'profile')),
      AsyncStorage.getItem(getStorageKey(uid, 'goals')),
      AsyncStorage.getItem(getStorageKey(uid, 'settings')),
    ]);

    const profile = profileData ? JSON.parse(profileData) : null;

    if (!profile) {
      return null;
    }

    const goals = goalsData ? JSON.parse(goalsData) : DEFAULT_GOALS;
    const settings = settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;

    return {
      id: uid,
      profile,
      goals,
      settings,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const createUser = async (
  uid: number,
  profile: UserProfile,
  goals?: Partial<UserGoals>,
  settings?: Partial<UserSettings>,
): Promise<UserData> => {
  try {
    const now = new Date().toISOString();
    const userProfile = {...profile, createdAt: now, updatedAt: now};
    const userGoals = {...DEFAULT_GOALS, ...goals};
    const userSettings = {...DEFAULT_SETTINGS, ...settings};

    await Promise.all([
      AsyncStorage.setItem(
        getStorageKey(uid, 'profile'),
        JSON.stringify(userProfile),
      ),
      AsyncStorage.setItem(
        getStorageKey(uid, 'goals'),
        JSON.stringify(userGoals),
      ),
      AsyncStorage.setItem(
        getStorageKey(uid, 'settings'),
        JSON.stringify(userSettings),
      ),
    ]);

    return {
      id: uid,
      profile: userProfile,
      goals: userGoals,
      settings: userSettings,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserGoals = async (
  uid: number,
  goals: Partial<UserGoals>,
): Promise<void> => {
  try {
    const existingGoalsData = await AsyncStorage.getItem(
      getStorageKey(uid, 'goals'),
    );
    const existingGoals = existingGoalsData
      ? JSON.parse(existingGoalsData)
      : DEFAULT_GOALS;
    const updatedGoals = {...existingGoals, ...goals};

    await AsyncStorage.setItem(
      getStorageKey(uid, 'goals'),
      JSON.stringify(updatedGoals),
    );
  } catch (error) {
    console.error('Error updating user goals:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  uid: number,
  settings: Partial<UserSettings>,
): Promise<void> => {
  try {
    const existingSettingsData = await AsyncStorage.getItem(
      getStorageKey(uid, 'settings'),
    );
    const existingSettings = existingSettingsData
      ? JSON.parse(existingSettingsData)
      : DEFAULT_SETTINGS;
    const updatedSettings = {...existingSettings, ...settings};

    await AsyncStorage.setItem(
      getStorageKey(uid, 'settings'),
      JSON.stringify(updatedSettings),
    );
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: number,
  profile: Partial<UserProfile>,
): Promise<void> => {
  try {
    const existingProfileData = await AsyncStorage.getItem(
      getStorageKey(uid, 'profile'),
    );
    if (!existingProfileData) {
      throw new Error('User profile not found');
    }

    const existingProfile = JSON.parse(existingProfileData);
    const updatedProfile = {
      ...existingProfile,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      getStorageKey(uid, 'profile'),
      JSON.stringify(updatedProfile),
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Initialize dummy users for testing
export const initializeDummyUsersIfNeeded = async (): Promise<void> => {
  try {
    const user1 = await getUserById(1001);
    const user2 = await getUserById(1002);

    if (!user1) {
      await createUser(
        1001,
        {
          username: 'Ahmed_Test',
          email: 'ahmed@test.com',
          phoneNumber: '+1234567890',
        },
        {
          monthlyZikrGoal: 1000,
          monthlyQuranPagesGoal: 30,
          monthlyCharityGoal: 100,
          monthlyFastingDaysGoal: 15,
        },
        {
          location: 'Cairo, Egypt',
          masjid: 'Al-Azhar Mosque',
          preferredMadhab: 'Hanafi',
          appLanguage: 'en',
          theme: 'light',
        },
      );
      console.log('Created dummy user 1001');
    }

    if (!user2) {
      await createUser(
        1002,
        {
          username: 'Fatima_Test',
          email: 'fatima@test.com',
          phoneNumber: '+0987654321',
        },
        {
          monthlyZikrGoal: 1500,
          monthlyQuranPagesGoal: 60,
          monthlyCharityGoal: 200,
          monthlyFastingDaysGoal: 20,
        },
        {
          location: 'Istanbul, Turkey',
          masjid: 'Blue Mosque',
          preferredMadhab: 'Shafi',
          appLanguage: 'ar',
          theme: 'dark',
        },
      );
      console.log('Created dummy user 1002');
    }
  } catch (error) {
    console.error('Error initializing dummy users:', error);
    throw error;
  }
};
