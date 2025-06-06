import database from '.';
import {Q} from '@nozbe/watermelondb';
import UserModel from '../../model/User';

export interface UserData {
  id: string;
  uid: number;
  username: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  masjid?: string;
  prayerSettings: string;
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
  preferredMadhab: string;
  appLanguage: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

// Check if users exist in the database
export const checkUsersExist = async (): Promise<boolean> => {
  const usersCollection = database.get<UserModel>('users');

  try {
    const userCount = await usersCollection.query().fetchCount();
    console.log('Users count in database:', userCount);
    return userCount > 0;
  } catch (error) {
    console.error('Error checking users exist:', error);
    return false;
  }
};

// Create dummy users for testing
export const createDummyUsers = async () => {
  console.log('=== Creating dummy users ===');

  try {
    await database.write(async () => {
      const usersCollection = database.get<UserModel>('users');

      // Dummy User 1
      const user1 = await usersCollection.create((user: UserModel) => {
        user.uid = 1001;
        user.username = 'Ahmed_Test';
        user.email = 'ahmed@test.com';
        user.phoneNumber = '+1234567890';
        user.location = 'Cairo, Egypt';
        user.masjid = 'Al-Azhar Mosque';
        user.prayerSettings = JSON.stringify({
          method: 'ISNA',
          notifications: true,
          sound: 'adhan1',
        });
        user.monthlyZikrGoal = 1000;
        user.monthlyQuranPagesGoal = 30;
        user.monthlyCharityGoal = 100;
        user.monthlyFastingDaysGoal = 15;
        user.preferredMadhab = 'Hanafi';
        user.appLanguage = 'en';
        user.theme = 'light';
      });

      // Dummy User 2
      const user2 = await usersCollection.create((user: UserModel) => {
        user.uid = 1002;
        user.username = 'Fatima_Test';
        user.email = 'fatima@test.com';
        user.phoneNumber = '+0987654321';
        user.location = 'Istanbul, Turkey';
        user.masjid = 'Blue Mosque';
        user.prayerSettings = JSON.stringify({
          method: 'Turkey',
          notifications: true,
          sound: 'adhan2',
        });
        user.monthlyZikrGoal = 1500;
        user.monthlyQuranPagesGoal = 60;
        user.monthlyCharityGoal = 200;
        user.monthlyFastingDaysGoal = 20;
        user.preferredMadhab = 'Shafi';
        user.appLanguage = 'ar';
        user.theme = 'dark';
      });

      console.log('Created dummy user 1:', user1.id);
      console.log('Created dummy user 2:', user2.id);
    });

    console.log('=== Dummy users created successfully ===');
  } catch (error) {
    console.error('Error creating dummy users:', error);
    throw error;
  }
};

// Initialize database with dummy users if empty
export const initializeDummyUsersIfNeeded = async () => {
  try {
    const usersExist = await checkUsersExist();

    if (!usersExist) {
      console.log('No users found, creating dummy users...');
      await createDummyUsers();
    } else {
      console.log('Users already exist, skipping dummy user creation');
    }
  } catch (error) {
    console.error('Error initializing dummy users:', error);
    throw error;
  }
};

// Debug function to print all users in the table
export const debugPrintAllUsers = async () => {
  const usersCollection = database.get<UserModel>('users');

  try {
    console.log('=== DEBUG: Fetching all users ===');

    // First initialize dummy users if needed
    await initializeDummyUsersIfNeeded();

    const allUsers = await usersCollection.query().fetch();
    console.log('Total users found:', allUsers.length);

    if (allUsers.length === 0) {
      console.log('No users found in the database');
    } else {
        console.log('Users found:', allUsers.length);
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id,
          uid: user.uid,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          location: user.location,
          masjid: user.masjid,
          prayerSettings: user.prayerSettings,
          monthlyZikrGoal: user.monthlyZikrGoal,
          monthlyQuranPagesGoal: user.monthlyQuranPagesGoal,
          monthlyCharityGoal: user.monthlyCharityGoal,
          monthlyFastingDaysGoal: user.monthlyFastingDaysGoal,
          preferredMadhab: user.preferredMadhab,
          appLanguage: user.appLanguage,
          theme: user.theme,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    }
    console.log('=== END DEBUG ===');

    return allUsers;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

export const getUserById = async (uid: number): Promise<UserData | null> => {
  const usersCollection = database.get<UserModel>('users');

  try {
    console.log('Querying for user with uid:', uid);

    // First ensure dummy users exist and print all users
    await debugPrintAllUsers();

    // Use find() for single record or query with first() for better performance
    const users = await usersCollection.query(Q.where('uid', uid)).fetch();

    console.log('Query result:', users);

    if (users.length === 0) {
      console.log('No user found with uid:', uid);
      return null;
    }

    const userData = users[0];
    console.log('Raw user data:', userData);

    return {
      id: userData.id,
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      masjid: userData.masjid,
      prayerSettings: userData.prayerSettings,
      monthlyZikrGoal: userData.monthlyZikrGoal,
      monthlyQuranPagesGoal: userData.monthlyQuranPagesGoal,
      monthlyCharityGoal: userData.monthlyCharityGoal,
      monthlyFastingDaysGoal: userData.monthlyFastingDaysGoal,
      preferredMadhab: userData.preferredMadhab,
      appLanguage: userData.appLanguage,
      theme: userData.theme,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const updateUserGoals = async (
  uid: number,
  goals: {
    monthlyZikrGoal?: number;
    monthlyQuranPagesGoal?: number;
    monthlyCharityGoal?: number;
    monthlyFastingDaysGoal?: number;
  },
) => {
  const usersCollection = database.get<UserModel>('users');

  try {
    const user = await usersCollection.query(Q.where('uid', uid)).fetch();

    if (user.length === 0) throw new Error('User not found');

    await database.write(async () => {
      await user[0].update((userData: UserModel) => {
        if (goals.monthlyZikrGoal !== undefined) {
          userData.monthlyZikrGoal = goals.monthlyZikrGoal;
        }
        if (goals.monthlyQuranPagesGoal !== undefined) {
          userData.monthlyQuranPagesGoal = goals.monthlyQuranPagesGoal;
        }
        if (goals.monthlyCharityGoal !== undefined) {
          userData.monthlyCharityGoal = goals.monthlyCharityGoal;
        }
        if (goals.monthlyFastingDaysGoal !== undefined) {
          userData.monthlyFastingDaysGoal = goals.monthlyFastingDaysGoal;
        }
      });
    });
  } catch (error) {
    console.error('Error updating user goals:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  uid: number,
  settings: {
    prayerSettings?: string;
    preferredMadhab?: string;
    appLanguage?: string;
    theme?: string;
    location?: string;
    masjid?: string;
  },
) => {
  const usersCollection = database.get<UserModel>('users');

  try {
    const user = await usersCollection.query(Q.where('uid', uid)).fetch();

    if (user.length === 0) throw new Error('User not found');

    await database.write(async () => {
      await user[0].update((userData: UserModel) => {
        if (settings.prayerSettings !== undefined) {
          userData.prayerSettings = settings.prayerSettings;
        }
        if (settings.preferredMadhab !== undefined) {
          userData.preferredMadhab = settings.preferredMadhab;
        }
        if (settings.appLanguage !== undefined) {
          userData.appLanguage = settings.appLanguage;
        }
        if (settings.theme !== undefined) {
          userData.theme = settings.theme;
        }
        if (settings.location !== undefined) {
          userData.location = settings.location;
        }
        if (settings.masjid !== undefined) {
          userData.masjid = settings.masjid;
        }
      });
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: number,
  profile: {
    username?: string;
    email?: string;
    phoneNumber?: string;
  },
) => {
  const usersCollection = database.get<UserModel>('users');

  try {
    const user = await usersCollection.query(Q.where('uid', uid)).fetch();

    if (user.length === 0) throw new Error('User not found');

    await database.write(async () => {
      await user[0].update((userData: UserModel) => {
        if (profile.username !== undefined) {
          userData.username = profile.username;
        }
        if (profile.email !== undefined) {
          userData.email = profile.email;
        }
        if (profile.phoneNumber !== undefined) {
          userData.phoneNumber = profile.phoneNumber;
        }
      });
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
