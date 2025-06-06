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

export const getUserById = async (uid: number): Promise<UserData | null> => {
  const usersCollection = database.get<UserModel>('users');

  try {
    const user = await usersCollection.query(Q.where('uid', uid)).fetch();

    if (user.length === 0) return null;

    const userData = user[0];
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

export const getUserPrayerStats = async (
  uid: number,
  period: 'week' | 'month' | 'year' = 'month',
) => {
  const prayerTracksCollection = database.get('prayer_tracks');

  try {
    let dateFilter;
    const now = new Date();

    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = Q.where(
          'date',
          Q.gte(weekAgo.toISOString().split('T')[0]),
        );
        break;
      case 'month':
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        dateFilter = Q.where(
          'date',
          Q.gte(monthAgo.toISOString().split('T')[0]),
        );
        break;
      case 'year':
        const yearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
        );
        dateFilter = Q.where(
          'date',
          Q.gte(yearAgo.toISOString().split('T')[0]),
        );
        break;
    }

    const prayerTracks = await prayerTracksCollection
      .query(Q.where('uid', uid), dateFilter)
      .fetch();

    const stats = prayerTracks.reduce(
      (acc, track) => ({
        fajrCompleted: acc.fajrCompleted + (track.fajrCompleted ? 1 : 0),
        dhuhrCompleted: acc.dhuhrCompleted + (track.dhuhrCompleted ? 1 : 0),
        asrCompleted: acc.asrCompleted + (track.asrCompleted ? 1 : 0),
        maghribCompleted:
          acc.maghribCompleted + (track.maghribCompleted ? 1 : 0),
        ishaCompleted: acc.ishaCompleted + (track.ishaCompleted ? 1 : 0),
        totalCompleted:
          acc.totalCompleted +
          (track.fajrCompleted ? 1 : 0) +
          (track.dhuhrCompleted ? 1 : 0) +
          (track.asrCompleted ? 1 : 0) +
          (track.maghribCompleted ? 1 : 0) +
          (track.ishaCompleted ? 1 : 0),
        totalDays: acc.totalDays + 1,
      }),
      {
        fajrCompleted: 0,
        dhuhrCompleted: 0,
        asrCompleted: 0,
        maghribCompleted: 0,
        ishaCompleted: 0,
        totalCompleted: 0,
        totalDays: 0,
      },
    );

    return stats;
  } catch (error) {
    console.error('Error getting prayer stats:', error);
    throw error;
  }
};

export const getMonthlyUserTotals = async (uid: number, month: string) => {
  // Query daily_tasks for the specified month and sum totals
  const dailyTasksCollection = database.get('daily_tasks');

  try {
    const monthlyTasks = await dailyTasksCollection
      .query(Q.where('uid', uid), Q.where('date', Q.like(`${month}%`)))
      .fetch();

    const totals = monthlyTasks.reduce(
      (acc, task) => ({
        totalZikr: acc.totalZikr + (task.totalZikrCount || 0),
        totalQuranPages: acc.totalQuranPages + (task.quranPagesRead || 0),
        totalCharity: acc.totalCharity + (task.charityAmount || 0),
        totalFastingDays:
          acc.totalFastingDays + (task.fastingCompleted ? 1 : 0),
      }),
      {
        totalZikr: 0,
        totalQuranPages: 0,
        totalCharity: 0,
        totalFastingDays: 0,
      },
    );

    return totals;
  } catch (error) {
    console.error('Error getting monthly totals:', error);
    throw error;
  }
};
